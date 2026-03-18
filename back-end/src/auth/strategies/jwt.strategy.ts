/**
 * JWT STRATEGY – Passport strategy that validates the Bearer token and attaches user to request.
 *
 * Pipeline: Protected route → JwtAuthGuard (calls this strategy) → Strategy validates JWT,
 * then validate() runs with payload; return value is attached as request.user.
 *
 * Students: When you move to MongoDB User, inject UsersService and return full user from DB
 * in validate(payload) instead of this stub payload.
 *
 * @see https://docs.nestjs.com/security/authentication#jwt-functionality
 * @see common/guards/jwt-auth.guard.ts (uses AuthGuard('jwt'))
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthUser } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  }
}
