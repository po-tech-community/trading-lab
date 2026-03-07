/**
 * @Public() decorator – marks a route as public (no JWT required).
 *
 * What it does: Sets metadata IS_PUBLIC_KEY so JwtAuthGuard skips auth for that route.
 * Use on controller methods (e.g. GET /todos, GET /todos/:id) that anyone can call without Bearer token.
 *
 * Use cases: Apply to read-only or login/signup routes; leave other routes protected by the guard.
 *
 * @see JwtAuthGuard (reads this metadata)
 * @see https://docs.nestjs.com/security/authorization
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
