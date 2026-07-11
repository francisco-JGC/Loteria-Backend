import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';

import type { Ticket } from '../../../domain/entities/ticket.entity';
import type {
  FindTicketsFilters,
  TicketsRepository,
} from '../../../domain/repositories/tickets.repository';
import { TicketLineOrmEntity } from '../entities/ticket-line.orm-entity';
import { TicketOrmEntity } from '../entities/ticket.orm-entity';
import { TicketMapper } from '../mappers/ticket.mapper';

@Injectable()
export class TypeOrmTicketsRepository implements TicketsRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repo: Repository<TicketOrmEntity>,
    @InjectRepository(TicketLineOrmEntity)
    private readonly linesRepo: Repository<TicketLineOrmEntity>,
  ) {}

  async save(ticket: Ticket): Promise<void> {
    const orm = TicketMapper.toOrm(ticket);
    await this.repo.manager.transaction(async (manager) => {
      await manager.save(TicketOrmEntity, orm);
      await manager.delete(TicketLineOrmEntity, { ticketId: orm.id });
      await manager.save(TicketLineOrmEntity, orm.lines);
    });
  }

  async findById(id: string): Promise<Ticket | null> {
    const found = await this.repo.findOne({ where: { id } });
    return found ? TicketMapper.toDomain(found) : null;
  }

  async findByFolio(folio: string): Promise<Ticket | null> {
    const found = await this.repo.findOne({ where: { folio } });
    return found ? TicketMapper.toDomain(found) : null;
  }

  async findMany(filters: FindTicketsFilters): Promise<Ticket[]> {
    const rows = await this.repo.find({
      where: this.buildWhere(filters),
      order: { createdAt: 'DESC' },
      take: filters.limit,
      skip: filters.offset,
    });
    return rows.map((row) => TicketMapper.toDomain(row));
  }

  countMany(filters: FindTicketsFilters): Promise<number> {
    return this.repo.count({ where: this.buildWhere(filters) });
  }

  private buildWhere(
    filters: FindTicketsFilters,
  ): FindOptionsWhere<TicketOrmEntity> {
    const where: FindOptionsWhere<TicketOrmEntity> = {};
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.salePointId) where.salePointId = filters.salePointId;
    if (filters.gameId) where.gameId = filters.gameId;
    if (filters.status) where.status = filters.status;
    if (filters.from && filters.to) {
      where.createdAt = Between(filters.from, filters.to);
    } else if (filters.from) {
      where.createdAt = MoreThanOrEqual(filters.from);
    } else if (filters.to) {
      where.createdAt = LessThanOrEqual(filters.to);
    }
    return where;
  }
}
