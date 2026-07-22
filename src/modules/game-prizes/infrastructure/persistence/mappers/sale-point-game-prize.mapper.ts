import { SalePointGamePrize } from '../../../domain/entities/sale-point-game-prize.entity';
import { SalePointGamePrizeOrmEntity } from '../entities/sale-point-game-prize.orm-entity';

export class SalePointGamePrizeMapper {
  static toDomain(orm: SalePointGamePrizeOrmEntity): SalePointGamePrize {
    return SalePointGamePrize.restore(orm.id, {
      salePointId: orm.salePointId,
      gameId: orm.gameId,
      mainMultiplier: orm.mainMultiplier ?? null,
      secondaryMultiplier: orm.secondaryMultiplier ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(prize: SalePointGamePrize): SalePointGamePrizeOrmEntity {
    const entity = new SalePointGamePrizeOrmEntity();
    entity.id = prize.id;
    entity.salePointId = prize.salePointId;
    entity.gameId = prize.gameId;
    entity.mainMultiplier = prize.mainMultiplier;
    entity.secondaryMultiplier = prize.secondaryMultiplier;
    entity.createdAt = prize.createdAt;
    entity.updatedAt = prize.updatedAt;
    return entity;
  }
}
