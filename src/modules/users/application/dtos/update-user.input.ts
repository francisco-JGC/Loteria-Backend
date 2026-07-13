import { UserRole } from '../../domain/value-objects/user-role';

export interface UpdateUserInput {
  id: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  /** New plaintext password. Skipped if undefined. */
  password?: string;
  /** `null` clears the value; `undefined` leaves it untouched. */
  address?: string | null;
  nationalId?: string | null;
  paymentPercentage?: number | null;
  salePointId?: string | null;
}
