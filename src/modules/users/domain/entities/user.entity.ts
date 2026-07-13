import { randomUUID } from 'crypto';

import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UserRole } from '../value-objects/user-role';

export interface UserProps {
  username: string;
  hashedPassword: string;
  name: string;
  role: UserRole;
  address: string | null;
  nationalId: string | null;
  paymentPercentage: number | null;
  salePointId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(id: string, props: UserProps) {
    super(id, props);
  }

  static create(input: {
    username: string;
    hashedPassword: string;
    name: string;
    role: UserRole;
    address?: string | null;
    nationalId?: string | null;
    paymentPercentage?: number | null;
    salePointId?: string | null;
  }): User {
    const now = new Date();
    return new User(randomUUID(), {
      username: input.username,
      hashedPassword: input.hashedPassword,
      name: input.name,
      role: input.role,
      address: input.address ?? null,
      nationalId: input.nationalId ?? null,
      paymentPercentage: input.paymentPercentage ?? null,
      salePointId: input.salePointId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(id: string, props: UserProps): User {
    return new User(id, props);
  }

  get username(): string {
    return this.props.username;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get hashedPassword(): string {
    return this.props.hashedPassword;
  }

  get address(): string | null {
    return this.props.address;
  }

  get nationalId(): string | null {
    return this.props.nationalId;
  }

  get paymentPercentage(): number | null {
    return this.props.paymentPercentage;
  }

  get salePointId(): string | null {
    return this.props.salePointId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
