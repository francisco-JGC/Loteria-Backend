import { Module } from '@nestjs/common';

import { GetDashboardSummary } from './application/use-cases/get-dashboard-summary.use-case';
import { DashboardController } from './infrastructure/http/controllers/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [GetDashboardSummary],
})
export class DashboardModule {}
