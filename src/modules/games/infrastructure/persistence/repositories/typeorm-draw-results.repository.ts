import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BUSINESS_TZ } from '../../../../../shared/domain/business-time';
import type { DrawResult } from '../../../domain/entities/draw-result.entity';
import type {
  DrawResultsFilters,
  DrawResultsRepository,
} from '../../../domain/repositories/draw-results.repository';
import { DrawResultOrmEntity } from '../entities/draw-result.orm-entity';
import { DrawResultMapper } from '../mappers/draw-result.mapper';

@Injectable()
export class TypeOrmDrawResultsRepository implements DrawResultsRepository {
  constructor(
    @InjectRepository(DrawResultOrmEntity)
    private readonly repo: Repository<DrawResultOrmEntity>,
  ) {}

  async save(result: DrawResult): Promise<void> {
    await this.repo.save(DrawResultMapper.toOrm(result));
  }

  async findById(id: string): Promise<DrawResult | null> {
    const found = await this.repo.findOne({ where: { id } });
    return found ? DrawResultMapper.toDomain(found) : null;
  }

  async findByGameAndDraw(
    gameId: string,
    drawAt: Date,
  ): Promise<DrawResult | null> {
    const found = await this.repo.findOne({ where: { gameId, drawAt } });
    return found ? DrawResultMapper.toDomain(found) : null;
  }

  async findMany(filters: DrawResultsFilters): Promise<DrawResult[]> {
    // Join with `games` so we can sort by (day desc, game.order_index asc,
    // time asc) — that's what web + mobile "últimos resultados" render:
    // all Diaria draws together, then Juega 3, etc., grouped by day.
    // The day boundary is computed in BUSINESS_TZ so a late-evening draw
    // in Managua doesn't spill into the next UTC bucket.
    const qb = this.repo
      .createQueryBuilder('dr')
      .innerJoin('games', 'g', 'g.id = dr.game_id');
    if (filters.gameId) {
      qb.andWhere('dr.game_id = :gameId', { gameId: filters.gameId });
    }
    if (filters.from) {
      qb.andWhere('dr.draw_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('dr.draw_at <= :to', { to: filters.to });
    }
    qb.orderBy(`(dr.draw_at AT TIME ZONE :tz)::date`, 'DESC')
      .addOrderBy('g.order_index', 'ASC')
      .addOrderBy('dr.draw_at', 'ASC')
      .setParameter('tz', BUSINESS_TZ);
    if (filters.limit) qb.take(filters.limit);
    if (filters.offset) qb.skip(filters.offset);
    const rows = await qb.getMany();
    return rows.map((row) => DrawResultMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
