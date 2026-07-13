import { User } from '../entities/user.entity';
import { UserRole } from '../value-objects/user-role';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface FindUsersOptions {
  role?: UserRole;
  search?: string;
  limit: number;
  offset: number;
}

export interface UsersRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findMany(options: FindUsersOptions): Promise<User[]>;
  count(options: Omit<FindUsersOptions, 'limit' | 'offset'>): Promise<number>;
  countAll(): Promise<number>;
}
