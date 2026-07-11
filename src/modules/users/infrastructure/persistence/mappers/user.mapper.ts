import { User } from '../../../domain/entities/user.entity';
import { UserOrmEntity } from '../entities/user.orm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.restore(orm.id, {
      username: orm.username,
      hashedPassword: orm.hashedPassword,
      name: orm.name,
      role: orm.role,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(user: User): UserOrmEntity {
    const entity = new UserOrmEntity();
    entity.id = user.id;
    entity.username = user.username;
    entity.hashedPassword = user.hashedPassword;
    entity.name = user.name;
    entity.role = user.role;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }
}
