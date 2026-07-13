import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role';

export interface UserOutput {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  address: string | null;
  nationalId: string | null;
  paymentPercentage: number | null;
  salePointId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toUserOutput = (user: User): UserOutput => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  address: user.address,
  nationalId: user.nationalId,
  paymentPercentage: user.paymentPercentage,
  salePointId: user.salePointId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
