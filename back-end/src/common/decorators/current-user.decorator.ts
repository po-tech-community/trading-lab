/**
 * @CurrentUser() – parameter decorator to get the authenticated user from request.user.
 *
 * Use on protected routes (after JwtAuthGuard has run). JwtStrategy attaches the payload
 * to request.user (e.g. { sub, email }). Example: create(@Body() dto: CreateTodoDto, @CurrentUser() user: JwtPayload).
 *
 * Optional key: @CurrentUser('email') returns only request.user.email.
 *
 * @see auth/strategies/jwt.strategy.ts (sets request.user)
 * @see https://docs.nestjs.com/security/authentication#jwt-functionality
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
