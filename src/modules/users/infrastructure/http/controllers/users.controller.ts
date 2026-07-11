import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { Public } from '../../../../auth/infrastructure/http/decorators/public.decorator';
import { Roles } from '../../../../auth/infrastructure/http/decorators/roles.decorator';
import { BootstrapFirstAdmin } from '../../../application/use-cases/bootstrap-first-admin.use-case';
import { CreateUser } from '../../../application/use-cases/create-user.use-case';
import { FindUserById } from '../../../application/use-cases/find-user-by-id.use-case';
import { UserOutput } from '../../../application/dtos/user.output';
import { UserRole } from '../../../domain/value-objects/user-role';
import { BootstrapAdminHttpDto } from '../dtos/bootstrap-admin-http.dto';
import { CreateUserHttpDto } from '../dtos/create-user-http.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUser,
    private readonly findUserById: FindUserById,
    private readonly bootstrapFirstAdmin: BootstrapFirstAdmin,
  ) {}

  @Post('bootstrap')
  @Public()
  bootstrap(@Body() dto: BootstrapAdminHttpDto): Promise<UserOutput> {
    return this.bootstrapFirstAdmin.execute(dto);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateUserHttpDto): Promise<UserOutput> {
    return this.createUser.execute(dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<UserOutput> {
    return this.findUserById.execute(id);
  }
}
