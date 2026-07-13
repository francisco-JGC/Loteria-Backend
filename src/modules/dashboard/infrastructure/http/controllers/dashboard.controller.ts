import { Controller, Get } from '@nestjs/common';

import { Roles } from '../../../../auth/infrastructure/http/decorators/roles.decorator';
import { UserRole } from '../../../../users/domain/value-objects/user-role';
import type { DashboardSummaryOutput } from '../../../application/dtos/dashboard-summary.output';
import { GetDashboardSummary } from '../../../application/use-cases/get-dashboard-summary.use-case';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getSummary: GetDashboardSummary) {}

  @Get('summary')
  @Roles(UserRole.ADMIN)
  summary(): Promise<DashboardSummaryOutput> {
    return this.getSummary.execute();
  }
}
