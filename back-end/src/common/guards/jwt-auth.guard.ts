/**
 * JwtAuthGuard – enforces JWT auth on routes unless @Public() is set.
 *
 * Uses Passport's JWT strategy: extracts Bearer token, JwtStrategy validates it and
 * attaches payload to request.user. Pipeline: Request → Guard (this) → Strategy.validate()
 * → Controller (request.user is set).
 *
 * Apply at controller level: @UseGuards(JwtAuthGuard). Use @Public() on methods that
 * should skip auth (e.g. GET list, GET one, or entire AuthController).
 *
 * @see auth/strategies/jwt.strategy.ts
 * @see Public decorator (common/decorators/public.decorator.ts)
 * @see https://docs.nestjs.com/security/authentication#jwt-functionality
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
