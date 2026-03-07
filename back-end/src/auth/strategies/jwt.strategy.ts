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

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return { sub: payload.sub, email: payload.email };
  }
}
