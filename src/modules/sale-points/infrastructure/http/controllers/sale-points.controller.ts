import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../../../auth/infrastructure/http/decorators/current-user.decorator';
import { Roles } from '../../../../auth/infrastructure/http/decorators/roles.decorator';
import { type RequestUser } from '../../../../auth/infrastructure/strategies/jwt.strategy';
import { UserRole } from '../../../../users/domain/value-objects/user-role';
import { type SalePointOutput } from '../../../application/dtos/sale-point.output';
import { CreateSalePoint } from '../../../application/use-cases/create-sale-point.use-case';
import { ListAllSalePoints } from '../../../application/use-cases/list-all-sale-points.use-case';
import { ListSalePointsForUser } from '../../../application/use-cases/list-sale-points-for-user.use-case';
import { ToggleSalePoint } from '../../../application/use-cases/toggle-sale-point.use-case';
import { CreateSalePointHttpDto } from '../dtos/create-sale-point-http.dto';
import { ToggleSalePointHttpDto } from '../dtos/toggle-sale-point-http.dto';

@Controller('sale-points')
export class SalePointsController {
  constructor(
    private readonly createSalePoint: CreateSalePoint,
    private readonly listAllSalePoints: ListAllSalePoints,
    private readonly listSalePointsForUser: ListSalePointsForUser,
    private readonly toggleSalePoint: ToggleSalePoint,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSalePointHttpDto): Promise<SalePointOutput> {
    return this.createSalePoint.execute(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(): Promise<SalePointOutput[]> {
    return this.listAllSalePoints.execute();
  }

  @Get('mine')
  findMine(@CurrentUser() user: RequestUser): Promise<SalePointOutput[]> {
    return this.listSalePointsForUser.execute(user.id);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN)
  toggle(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ToggleSalePointHttpDto,
  ): Promise<SalePointOutput> {
    return this.toggleSalePoint.execute({ id, active: dto.active });
  }
}
