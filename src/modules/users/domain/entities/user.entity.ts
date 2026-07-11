import { randomUUID } from 'crypto';

import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UserRole } from '../value-objects/user-role';

export interface UserProps {
  username: string;
  hashedPassword: string;
  name: string;
  role: UserRole;
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
  }): User {
    const now = new Date();
    return new User(randomUUID(), {
      username: input.username,
      hashedPassword: input.hashedPassword,
      name: input.name,
      role: input.role,
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
