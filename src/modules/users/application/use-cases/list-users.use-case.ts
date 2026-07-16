import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
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
  ) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    // Partner scoping: partners see only users they created themselves.
    // Admin sees everyone. Sellers never reach this endpoint (role-gated).
    const createdById =
      input.requesterRole === UserRole.PARTNER
        ? input.requesterId
        : undefined;

    const filters = {
      role: input.role,
      search: input.search,
      createdById,
      limit: input.limit,
      offset: input.offset,
    };

    const [items, total] = await Promise.all([
      this.users.findMany(filters),
      this.users.count({
        role: input.role,
        search: input.search,
        createdById,
      }),
    ]);

    // Bulk-resolve creator names to avoid N+1 in the "Creado por" column.
    const creatorIds = Array.from(
      new Set(
        items
          .map((u) => u.createdById)
          .filter((id): id is string => id !== null),
      ),
    );
    const creators = await this.users.findByIds(creatorIds);
    const creatorNameById = new Map(creators.map((c) => [c.id, c.name]));

    return {
      items: items.map((u) =>
        toUserOutput(u, u.createdById ? creatorNameById.get(u.createdById) ?? null : null),
      ),
      total,
      limit: input.limit,
      offset: input.offset,
    };
  }
}
