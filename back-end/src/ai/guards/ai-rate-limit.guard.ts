import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { sub?: string };
      ip?: string;
    }>();

    const maxRequests = this.configService.get<number>('AI_RATE_LIMIT_MAX', 10);
    const windowMs = this.configService.get<number>(
      'AI_RATE_LIMIT_WINDOW_MS',
      60_000,
    );

    const identity = request.user?.sub ?? request.ip ?? 'unknown';
    const key = `ai:analyze:rate-limit:${identity}`;
    const currentCount = (await this.cacheManager.get<number>(key)) ?? 0;

    if (currentCount >= maxRequests) {
      throw new HttpException(
        'Too many AI analyze requests. Please retry later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, currentCount + 1, windowMs);
    return true;
  }
}
