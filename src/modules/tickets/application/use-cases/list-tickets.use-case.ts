import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { PartnerScopeService } from '../../../sale-points/application/services/partner-scope.service';
import { UserRole } from '../../../users/domain/value-objects/user-role';
import {
  TICKETS_REPOSITORY,
  type TicketsRepository,
} from '../../domain/repositories/tickets.repository';
import type { TicketStatus } from '../../domain/value-objects/ticket-status';
import { toTicketOutput, type TicketOutput } from '../dtos/ticket.output';

export interface ListTicketsInput {
  requesterId: string;
  requesterRole: UserRole;
  salePointId?: string;
  gameId?: string;
  sellerId?: string;
  status?: TicketStatus;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface ListTicketsOutput {
  items: TicketOutput[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class ListTickets implements UseCase<ListTicketsInput, ListTicketsOutput> {
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly tickets: TicketsRepository,
    private readonly scope: PartnerScopeService,
  ) {}

  async execute(input: ListTicketsInput): Promise<ListTicketsOutput> {
    const effectiveSellerId =
      input.requesterRole === UserRole.SELLER
        ? input.requesterId
        : input.sellerId;

    // Partner scoping: admin sees all, partner is restricted to their
    // sucursales, seller-scoping already happened via sellerId above.
    const accessibleSalePointIds = await this.scope.getAccessibleSalePointIds(
      input.requesterId,
      input.requesterRole,
    );

    const filters = {
      sellerId: effectiveSellerId,
      salePointId: input.salePointId,
      salePointIds: accessibleSalePointIds ?? undefined,
      gameId: input.gameId,
      status: input.status,
      from: input.from,
      to: input.to,
      limit: input.limit,
      offset: (input.page - 1) * input.limit,
    };

    const [items, total] = await Promise.all([
      this.tickets.findMany(filters),
      this.tickets.countMany(filters),
    ]);

    return {
      items: items.map((ticket) => toTicketOutput(ticket)),
      page: input.page,
      limit: input.limit,
      total,
    };
  }
}
