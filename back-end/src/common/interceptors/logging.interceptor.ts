/**
 * Global LOGGING interceptor – logs every API request and response.
 *
 * Pipeline order: Middleware (if any) → Guard → This interceptor → Pipe → Controller.
 * Logs: method, url, body (passwords redacted), then statusCode and duration after response.
 *
 * Use cases: Debugging, audit. Apply globally in main.ts with app.useGlobalInterceptors().
 *
 * @see https://docs.nestjs.com/interceptors
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

const SENSITIVE_KEYS = ['password', 'currentPassword', 'newPassword'];

function sanitize(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE_KEYS.some(
      (key) => k.toLowerCase().includes(key.toLowerCase()),
    )
      ? '[REDACTED]'
      : sanitize(v);
  }
  return out;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const body = req.body && Object.keys(req.body).length ? req.body : undefined;

    console.log(
      `[Req] ${method} ${url}`,
      body ? `body=${JSON.stringify(sanitize(body))}` : '',
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const status = http.getResponse().statusCode;
          const duration = Date.now() - start;
          console.log(`[Res] ${method} ${url} ${status} ${duration}ms`);
        },
        error: (err) => {
          const status = err.status ?? 500;
          const duration = Date.now() - start;
          console.log(`[Res] ${method} ${url} ${status} ${duration}ms (error)`);
        },
      }),
    );
  }
}
