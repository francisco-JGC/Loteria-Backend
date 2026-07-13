import { Inject, Injectable } from '@nestjs/common';

import { UseCase } from '../../../../shared/application/use-case';
import { NotFoundError } from '../../../../shared/domain/errors/domain.error';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users.repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../ports/password-hasher.port';
import { type UpdateUserInput } from '../dtos/update-user.input';
import { toUserOutput, type UserOutput } from '../dtos/user.output';

@Injectable()
export class UpdateUser implements UseCase<UpdateUserInput, UserOutput> {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: UpdateUserInput): Promise<UserOutput> {
    const user = await this.users.findById(input.id);
    if (!user) throw new NotFoundError('User', input.id);

    const patch: Parameters<typeof user.update>[0] = {
      name: input.name,
      role: input.role,
      isActive: input.isActive,
      address: input.address,
      nationalId: input.nationalId,
      paymentPercentage: input.paymentPercentage,
      salePointId: input.salePointId,
    };
    if (input.password) {
      patch.hashedPassword = await this.hasher.hash(input.password);
    }
    user.update(patch);
    await this.users.save(user);
    return toUserOutput(user);
  }
}
