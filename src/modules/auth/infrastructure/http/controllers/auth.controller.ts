import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthOutput } from '../../../application/dtos/auth.output';
import { Login } from '../../../application/use-cases/login.use-case';
import {
  CurrentUser,
} from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { LoginHttpDto } from '../dtos/login-http.dto';
import { type RequestUser } from '../../strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: Login) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginHttpDto): Promise<AuthOutput> {
    return this.loginUseCase.execute(dto);
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser): RequestUser {
    return user;
  }
}
