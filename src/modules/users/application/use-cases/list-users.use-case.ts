import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { PartnerScopeService } from '../../../sale-points/application/services/partner-scope.service';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users.repository';
import { UserRole } from '../../domain/value-objects/user-role';
import { toUserOutput, type UserOutput } from '../dtos/user.output';

export interface ListUsersInput {
  requesterId: string;
  requesterRole: UserRole;
  role?: UserRole;
  search?: string;
  limit: number;
  offset: number;
}

export interface ListUsersOutput {
  items: UserOutput[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class ListUsers implements UseCase<ListUsersInput, ListUsersOutput> {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly scope: PartnerScopeService,
  ) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    // Partner scoping: a partner only sees users assigned to sucursales
    // they own. Admin sees all. The scope is derived from the caller,
    // never from client input.
    const partnerScope = await this.scope.getAccessibleSalePointIds(
      input.requesterId,
      input.requesterRole,
    );
    if (partnerScope !== null && partnerScope.length === 0) {
      return {
        items: [],
        total: 0,
        limit: input.limit,
        offset: input.offset,
      };
    }

    const filters = {
      role: input.role,
      search: input.search,
      salePointIds: partnerScope ?? undefined,
      limit: input.limit,
      offset: input.offset,
    };

    const [items, total] = await Promise.all([
      this.users.findMany(filters),
      this.users.count({
        role: input.role,
        search: input.search,
        salePointIds: partnerScope ?? undefined,
      }),
    ]);
    return {
      items: items.map(toUserOutput),
      total,
      limit: input.limit,
      offset: input.offset,
    };
  }
}
