import { UserRole } from '../../domain/value-objects/user-role';

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  address?: string | null;
  nationalId?: string | null;
  paymentPercentage?: number | null;
  salePointId?: string | null;
}
