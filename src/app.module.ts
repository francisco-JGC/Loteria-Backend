import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { SalePointsModule } from './modules/sale-points/sale-points.module';
import { UsersModule } from './modules/users/users.module';
import { envLoader, envSchema } from './shared/infrastructure/config/env.config';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter';
import { DatabaseModule } from './shared/infrastructure/persistence/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [envLoader],
      validationSchema: envSchema,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    SalePointsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
