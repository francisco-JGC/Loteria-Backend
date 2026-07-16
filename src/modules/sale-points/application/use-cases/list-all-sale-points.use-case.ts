import { Inject, Injectable } from '@nestjs/common';

import { UseCase } from '../../../../shared/application/use-case';
import { UserRole } from '../../../users/domain/value-objects/user-role';
import {
  SALE_POINTS_REPOSITORY,
  type SalePointsRepository,
} from '../../domain/repositories/sale-points.repository';
import { toSalePointOutput, type SalePointOutput } from '../dtos/sale-point.output';

export interface ListAllSalePointsInput {
  requesterId: string;
  requesterRole: UserRole;
}

/**
 * Admin → every sucursal.
 * Partner → only sucursales they own (via `owner_partner_id`).
 * (Sellers use `/sale-points/mine`, this endpoint is web-only.)
 */
@Injectable()
export class ListAllSalePoints
  implements UseCase<ListAllSalePointsInput, SalePointOutput[]>
{
  constructor(
    @Inject(SALE_POINTS_REPOSITORY)
    private readonly salePoints: SalePointsRepository,
  ) {}

  async execute(input: ListAllSalePointsInput): Promise<SalePointOutput[]> {
    const list =
      input.requesterRole === UserRole.PARTNER
        ? await this.salePoints.findByPartner(input.requesterId)
        : await this.salePoints.findAll();
    return list.map(toSalePointOutput);
  }
}
