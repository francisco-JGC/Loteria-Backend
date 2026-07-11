import { UserRole } from '../../../users/domain/value-objects/user-role';

export interface AuthenticatedUserDto {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface AuthOutput {
  accessToken: string;
  user: AuthenticatedUserDto;
}
