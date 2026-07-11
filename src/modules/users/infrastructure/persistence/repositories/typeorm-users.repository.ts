import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../../domain/entities/user.entity';
import { UsersRepository } from '../../../domain/repositories/users.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async save(user: User): Promise<void> {
    await this.repo.save(UserMapper.toOrm(user));
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.repo.findOne({ where: { id } });
    return found ? UserMapper.toDomain(found) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const found = await this.repo.findOne({ where: { username } });
    return found ? UserMapper.toDomain(found) : null;
  }

  countAll(): Promise<number> {
    return this.repo.count();
  }
}
