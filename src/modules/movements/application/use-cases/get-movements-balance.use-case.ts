import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  SALE_POINTS_REPOSITORY,
  type SalePointsRepository,
} from '../../../sale-points/domain/repositories/sale-points.repository';
import { PartnerScopeService } from '../../../sale-points/application/services/partner-scope.service';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../../users/domain/repositories/users.repository';
import { UserRole } from '../../../users/domain/value-objects/user-role';
import type {
  MovementsBalanceOutput,
  MovementsBalanceRow,
} from '../dtos/movements-balance.output';

export interface GetMovementsBalanceInput {
  requesterId: string;
  requesterRole: UserRole;
  salePointId?: string;
  from?: Date;
  to?: Date;
}

interface RawRow {
  sale_point_id: string;
  billed: string;
  paid_prize: string;
  deposits: string;
  withdrawals: string;
  expenses: string;
}

/**
 * Combines ticket cash flow (sales − prizes) with manually-registered
 * movements (deposits, withdrawals, expenses) into a per-sucursal balance.
 * A single SQL round-trip using a UNION ALL keeps this cheap even as
 * volume grows.
 */
@Injectable()
export class GetMovementsBalance
  implements UseCase<GetMovementsBalanceInput, MovementsBalanceOutput>
{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(SALE_POINTS_REPOSITORY)
    private readonly salePoints: SalePointsRepository,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly scope: PartnerScopeService,
  ) {}

  async execute(
    input: GetMovementsBalanceInput,
  ): Promise<MovementsBalanceOutput> {
    if (input.requesterRole === UserRole.SELLER) return { items: [] };

    const partnerScope = await this.scope.getAccessibleSalePointIds(
      input.requesterId,
      input.requesterRole,
    );
    if (partnerScope !== null && partnerScope.length === 0) {
      return { items: [] };
    }

    // Pull the six numeric buckets in one query. A UNION ALL is used so
    // sucursales without tickets can still show up because they have
    // movements (or vice versa), and both sides share the same filters.
    const rows = await this.dataSource.query<RawRow[]>(
      `
      WITH
        ticket_flow AS (
          SELECT
            t.sale_point_id::text AS sale_point_id,
            COALESCE(SUM(CASE WHEN t.status = 'valid' THEN t.total ELSE 0 END), 0)::bigint AS billed,
            COALESCE(SUM(CASE WHEN t.paid_at IS NOT NULL THEN t.paid_prize ELSE 0 END), 0)::bigint AS paid_prize
          FROM tickets t
          WHERE ($1::uuid IS NULL OR t.sale_point_id = $1::uuid)
            AND ($2::timestamptz IS NULL OR t.created_at >= $2::timestamptz)
            AND ($3::timestamptz IS NULL OR t.created_at <  $3::timestamptz)
            AND ($4::uuid[] IS NULL OR t.sale_point_id = ANY($4::uuid[]))
          GROUP BY t.sale_point_id
        ),
        movement_flow AS (
          SELECT
            m.sale_point_id::text AS sale_point_id,
            COALESCE(SUM(CASE WHEN m.type = 'deposit'    THEN m.amount ELSE 0 END), 0)::bigint AS deposits,
            COALESCE(SUM(CASE WHEN m.type = 'withdrawal' THEN m.amount ELSE 0 END), 0)::bigint AS withdrawals,
            COALESCE(SUM(CASE WHEN m.type = 'expense'    THEN m.amount ELSE 0 END), 0)::bigint AS expenses
          FROM movements m
          WHERE ($1::uuid IS NULL OR m.sale_point_id = $1::uuid)
            AND ($2::timestamptz IS NULL OR m.occurred_at >= $2::timestamptz)
            AND ($3::timestamptz IS NULL OR m.occurred_at <  $3::timestamptz)
            AND ($4::uuid[] IS NULL OR m.sale_point_id = ANY($4::uuid[]))
          GROUP BY m.sale_point_id
        )
      SELECT
        COALESCE(tf.sale_point_id, mf.sale_point_id) AS sale_point_id,
        COALESCE(tf.billed, 0)::bigint      AS billed,
        COALESCE(tf.paid_prize, 0)::bigint  AS paid_prize,
        COALESCE(mf.deposits, 0)::bigint    AS deposits,
        COALESCE(mf.withdrawals, 0)::bigint AS withdrawals,
        COALESCE(mf.expenses, 0)::bigint    AS expenses
      FROM ticket_flow tf
      FULL OUTER JOIN movement_flow mf ON mf.sale_point_id = tf.sale_point_id
      `,
      [
        input.salePointId ?? null,
        input.from ?? null,
        input.to ?? null,
        partnerScope,
      ],
    );

    if (rows.length === 0) return { items: [] };

    // Bulk-resolve sucursal + partner names.
    const salePointIds = rows.map((r) => r.sale_point_id);
    const salePoints = await Promise.all(
      salePointIds.map((id) => this.salePoints.findById(id)),
    );
    const salePointById = new Map(
      salePoints
        .filter((sp): sp is NonNullable<typeof sp> => sp !== null)
        .map((sp) => [sp.id, sp]),
    );

    const partnerIds = Array.from(
      new Set(
        salePoints
          .filter((sp): sp is NonNullable<typeof sp> => sp !== null)
          .map((sp) => sp.ownerPartnerId)
          .filter((id): id is string => id !== null),
      ),
    );
    const partners = await this.users.findByIds(partnerIds);
    const partnerNameById = new Map(partners.map((p) => [p.id, p.name]));

    const items: MovementsBalanceRow[] = rows.map((r) => {
      const sp = salePointById.get(r.sale_point_id);
      const billed = Number(r.billed);
      const paidPrize = Number(r.paid_prize);
      const deposits = Number(r.deposits);
      const withdrawals = Number(r.withdrawals);
      const expenses = Number(r.expenses);
      const net = billed - paidPrize + deposits - withdrawals - expenses;
      return {
        salePointId: r.sale_point_id,
        salePointName: sp?.name ?? '—',
        ownerPartnerId: sp?.ownerPartnerId ?? null,
        ownerPartnerName: sp?.ownerPartnerId
          ? partnerNameById.get(sp.ownerPartnerId) ?? null
          : null,
        billed,
        paidPrize,
        deposits,
        withdrawals,
        expenses,
        net,
      };
    });

    items.sort((a, b) => b.net - a.net);
    return { items };
  }
}
