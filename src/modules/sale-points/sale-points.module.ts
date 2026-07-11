import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { SALE_POINTS_REPOSITORY } from './domain/repositories/sale-points.repository';
import { CreateSalePoint } from './application/use-cases/create-sale-point.use-case';
import { ListAllSalePoints } from './application/use-cases/list-all-sale-points.use-case';
import { ListSalePointsByOwner } from './application/use-cases/list-sale-points-by-owner.use-case';
import { ToggleSalePoint } from './application/use-cases/toggle-sale-point.use-case';
import { SalePointsController } from './infrastructure/http/controllers/sale-points.controller';
import { SalePointOrmEntity } from './infrastructure/persistence/entities/sale-point.orm-entity';
import { TypeOrmSalePointsRepository } from './infrastructure/persistence/repositories/typeorm-sale-points.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SalePointOrmEntity]), UsersModule],
  controllers: [SalePointsController],
  providers: [
    { provide: SALE_POINTS_REPOSITORY, useClass: TypeOrmSalePointsRepository },
    CreateSalePoint,
    ListAllSalePoints,
    ListSalePointsByOwner,
    ToggleSalePoint,
  ],
  exports: [SALE_POINTS_REPOSITORY, ListSalePointsByOwner],
})
export class SalePointsModule {}
