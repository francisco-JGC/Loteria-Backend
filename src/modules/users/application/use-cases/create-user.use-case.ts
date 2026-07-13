import { Inject, Injectable } from '@nestjs/common';

import { UseCase } from '../../../../shared/application/use-case';
import { ValidationError } from '../../../../shared/domain/errors/domain.error';
import { User } from '../../domain/entities/user.entity';
import { USERS_REPOSITORY, type UsersRepository } from '../../domain/repositories/users.repository';
import { type CreateUserInput } from '../dtos/create-user.input';
import { toUserOutput, type UserOutput } from '../dtos/user.output';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher.port';

@Injectable()
export class CreateUser implements UseCase<CreateUserInput, UserOutput> {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const existing = await this.users.findByUsername(input.username);
    if (existing) throw new ValidationError('Username already taken');

    const hashed = await this.hasher.hash(input.password);
    const user = User.create({
      username: input.username,
      hashedPassword: hashed,
      name: input.name,
      role: input.role,
      address: input.address ?? null,
      nationalId: input.nationalId ?? null,
      paymentPercentage: input.paymentPercentage ?? null,
      salePointId: input.salePointId ?? null,
    });
    await this.users.save(user);
    return toUserOutput(user);
  }
}
