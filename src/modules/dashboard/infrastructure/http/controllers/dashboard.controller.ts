import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../../../../auth/infrastructure/http/decorators/current-user.decorator';
import { Roles } from '../../../../auth/infrastructure/http/decorators/roles.decorator';
import { type RequestUser } from '../../../../auth/infrastructure/strategies/jwt.strategy';
import { UserRole } from '../../../../users/domain/value-objects/user-role';
import type { DashboardSummaryOutput } from '../../../application/dtos/dashboard-summary.output';
import { GetDashboardSummary } from '../../../application/use-cases/get-dashboard-summary.use-case';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getSummary: GetDashboardSummary) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  summary(@CurrentUser() user: RequestUser): Promise<DashboardSummaryOutput> {
    return this.getSummary.execute({
      requesterId: user.id,
      requesterRole: user.role,
    });
  }
}
