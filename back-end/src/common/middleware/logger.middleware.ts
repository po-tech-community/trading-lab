/**
 * Simple LOGGER middleware – runs first in the pipeline (before guards/interceptors).
 *
 * Request flow order: 1) Middleware 2) Guard 3) Interceptor 4) Pipe 5) Controller.
 * This middleware only logs "Incoming request"; full request/response logging is in LoggingInterceptor.
 *
 * Students: Add more middleware here (e.g. request-id, rate limit) or in app.module.ts.
 *
 * @see https://docs.nestjs.com/middleware
 * @see main.ts (interceptor), auth (guard), ValidationPipe (pipe)
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    console.log(`[Middleware] Incoming ${req.method} ${req.originalUrl || req.url}`);
    next();
  }
}
