import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role';

export interface UserOutput {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export const toUserOutput = (user: User): UserOutput => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
