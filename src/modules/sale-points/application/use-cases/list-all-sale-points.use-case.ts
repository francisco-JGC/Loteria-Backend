import { Inject, Injectable } from '@nestjs/common';

import { UseCase } from '../../../../shared/application/use-case';
import {
  SALE_POINTS_REPOSITORY,
  type SalePointsRepository,
} from '../../domain/repositories/sale-points.repository';
import { toSalePointOutput, type SalePointOutput } from '../dtos/sale-point.output';

@Injectable()
export class ListAllSalePoints implements UseCase<void, SalePointOutput[]> {
  constructor(
    @Inject(SALE_POINTS_REPOSITORY)
    private readonly salePoints: SalePointsRepository,
  ) {}

  async execute(): Promise<SalePointOutput[]> {
    const list = await this.salePoints.findAll();
    return list.map(toSalePointOutput);
  }
}
