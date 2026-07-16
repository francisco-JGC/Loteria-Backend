import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { UseCase } from '../../../../shared/application/use-case';
import { ValidationError } from '../../../../shared/domain/errors/domain.error';
import { PartnerScopeService } from '../../../sale-points/application/services/partner-scope.service';
import { User } from '../../domain/entities/user.entity';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users.repository';
import { UserRole } from '../../domain/value-objects/user-role';
import { type CreateUserInput } from '../dtos/create-user.input';
import { toUserOutput, type UserOutput } from '../dtos/user.output';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher.port';

@Injectable()
export class CreateUser implements UseCase<CreateUserInput, UserOutput> {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly scope: PartnerScopeService,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    // Partners can create their own sellers only — no admins, no other
    // partners, and the target must land inside one of their sucursales.
    if (input.requesterRole === UserRole.PARTNER) {
      if (input.role !== UserRole.SELLER) {
        throw new ForbiddenException(
          'Un socio solo puede crear usuarios con rol vendedor',
        );
      }
      if (!input.salePointId) {
        throw new ValidationError(
          'Debes asignar el vendedor a una de tus sucursales',
        );
      }
      const owned = await this.scope.getAccessibleSalePointIds(
        input.requesterId,
        input.requesterRole,
      );
      if (owned === null || !owned.includes(input.salePointId)) {
        throw new ForbiddenException(
          'Esa sucursal no te pertenece',
        );
      }
    }

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
