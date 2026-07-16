import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SalePoint } from '../../../domain/entities/sale-point.entity';
import { SalePointsRepository } from '../../../domain/repositories/sale-points.repository';
import { SalePointOrmEntity } from '../entities/sale-point.orm-entity';
import { SalePointMapper } from '../mappers/sale-point.mapper';

@Injectable()
export class TypeOrmSalePointsRepository implements SalePointsRepository {
  constructor(
    @InjectRepository(SalePointOrmEntity)
    private readonly repo: Repository<SalePointOrmEntity>,
  ) {}

  async save(salePoint: SalePoint): Promise<void> {
    await this.repo.save(SalePointMapper.toOrm(salePoint));
  }

  async findById(id: string): Promise<SalePoint | null> {
    const found = await this.repo.findOne({ where: { id } });
    return found ? SalePointMapper.toDomain(found) : null;
  }

  async findByCode(code: string): Promise<SalePoint | null> {
    const found = await this.repo.findOne({ where: { code } });
    return found ? SalePointMapper.toDomain(found) : null;
  }

  async findAll(): Promise<SalePoint[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map((row) => SalePointMapper.toDomain(row));
  }

  async findByPartner(partnerId: string): Promise<SalePoint[]> {
    const rows = await this.repo.find({
      where: { ownerPartnerId: partnerId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => SalePointMapper.toDomain(row));
  }
}
