import { Inject, Injectable } from '@nestjs/common';

import { UseCase } from '../../../../shared/application/use-case';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/errors/domain.error';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../../users/domain/repositories/users.repository';
import { UserRole } from '../../../users/domain/value-objects/user-role';
import { SalePoint } from '../../domain/entities/sale-point.entity';
import {
  SALE_POINTS_REPOSITORY,
  type SalePointsRepository,
} from '../../domain/repositories/sale-points.repository';
import { type CreateSalePointInput } from '../dtos/create-sale-point.input';
import { toSalePointOutput, type SalePointOutput } from '../dtos/sale-point.output';

@Injectable()
export class CreateSalePoint
  implements UseCase<CreateSalePointInput, SalePointOutput>
{
  constructor(
    @Inject(SALE_POINTS_REPOSITORY)
    private readonly salePoints: SalePointsRepository,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
  ) {}

  async execute(input: CreateSalePointInput): Promise<SalePointOutput> {
    const owner = await this.users.findById(input.ownerId);
    if (!owner) throw new NotFoundError('User', input.ownerId);
    if (owner.role !== UserRole.SELLER) {
      throw new ValidationError(
        'Only users with role "seller" can own a sale point',
      );
    }

    const existing = await this.salePoints.findByCode(input.code);
    if (existing) throw new ValidationError('Code already taken');

    const salePoint = SalePoint.create({
      name: input.name,
      code: input.code,
      ownerId: input.ownerId,
    });
    await this.salePoints.save(salePoint);
    return toSalePointOutput(salePoint);
  }
}
