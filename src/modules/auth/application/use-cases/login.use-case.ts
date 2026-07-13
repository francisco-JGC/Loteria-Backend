import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { UseCase } from '../../../../shared/application/use-case';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../users/application/ports/password-hasher.port';
import { FindUserByUsername } from '../../../users/application/use-cases/find-user-by-username.use-case';
import { type AuthOutput } from '../dtos/auth.output';
import { type LoginInput } from '../dtos/login.input';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service.port';

@Injectable()
export class Login implements UseCase<LoginInput, AuthOutput> {
  constructor(
    private readonly findUserByUsername: FindUserByUsername,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<AuthOutput> {
    const user = await this.findUserByUsername.execute(input.username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordOk = await this.hasher.compare(input.password, user.hashedPassword);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your access has been disabled. Contact an administrator.',
      );
    }

    const accessToken = await this.tokens.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }
}
