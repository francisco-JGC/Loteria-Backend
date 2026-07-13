import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users.repository';
import { UserRole } from '../../domain/value-objects/user-role';
import { toUserOutput, type UserOutput } from '../dtos/user.output';

export interface ListUsersInput {
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
    const [items, total] = await Promise.all([
      this.users.findMany(input),
      this.users.count({ role: input.role, search: input.search }),
    ]);
    return {
      items: items.map(toUserOutput),
      total,
      limit: input.limit,
      offset: input.offset,
    };
  }
}
