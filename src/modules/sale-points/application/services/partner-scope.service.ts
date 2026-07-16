import { Inject, Injectable } from '@nestjs/common';

import { UserRole } from '../../../users/domain/value-objects/user-role';
import {
  SALE_POINTS_REPOSITORY,
  type SalePointsRepository,
} from '../../domain/repositories/sale-points.repository';

/**
 * Which sucursales a requester is allowed to see. Every list/report use
 * case that returns rows scoped to a sucursal must consult this service
 * so the partner-vs-admin isolation stays in one place.
 *
 * Contract:
 * - `null` → **no restriction** (admin sees everything, including sucursales
 *   with `owner_partner_id IS NULL`).
 * - `string[]` → restrict to exactly this set of `sale_points.id` values.
 *   An empty array is meaningful: the partner owns nothing and their
 *   result set must be empty (do NOT convert `[]` → "no filter").
 */
export type AccessibleSalePointScope = string[] | null;

@Injectable()
export class PartnerScopeService {
  constructor(
    @Inject(SALE_POINTS_REPOSITORY)
    private readonly salePoints: SalePointsRepository,
  ) {}

  async getAccessibleSalePointIds(
    requesterId: string,
    role: UserRole,
  ): Promise<AccessibleSalePointScope> {
    if (role === UserRole.ADMIN) return null;
    if (role === UserRole.PARTNER) {
      const owned = await this.salePoints.findByPartner(requesterId);
      return owned.map((sp) => sp.id);
    }
    // Sellers scope by seller_id (their own tickets); this service isn't
    // used for that path — return an empty set to fail-closed if it ever is.
    return [];
  }
}
