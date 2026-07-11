import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

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
    const where: Record<string, unknown> = {};
    if (filters.gameId) where.gameId = filters.gameId;
    if (filters.from && filters.to) {
      where.drawAt = Between(filters.from, filters.to);
    } else if (filters.from) {
      where.drawAt = MoreThanOrEqual(filters.from);
    } else if (filters.to) {
      where.drawAt = LessThanOrEqual(filters.to);
    }
    const rows = await this.repo.find({
      where,
      order: { drawAt: 'DESC' },
      take: filters.limit,
      skip: filters.offset,
    });
    return rows.map((row) => DrawResultMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
