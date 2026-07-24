import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';

import type { AppConfig } from '../config/env.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<AppConfig, true>,
      ): TypeOrmModuleOptions => {
        const db = config.get('database', { infer: true });
        const nodeEnv = config.get('nodeEnv', { infer: true });
        const shared: TypeOrmModuleOptions = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize: false,
          logging: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
        };
        // Hosted Postgres (Railway/Neon/Supabase) — prefer DATABASE_URL + SSL.
        if (db.url) {
          return {
            ...shared,
            url: db.url,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          ...shared,
          host: db.host!,
          port: db.port!,
          username: db.user!,
          password: db.password!,
          database: db.name!,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
