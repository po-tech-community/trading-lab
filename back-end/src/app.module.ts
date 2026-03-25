/**
 * Root APP MODULE – assembles the application.
 *
 * What it does:
 * - imports: ConfigModule (global), MongooseModule (MongoDB), CacheModule (Redis or in-memory),
 *   AuthModule, UsersModule, TodosModule. Each feature module exposes its routes and optionally exports services.
 * - middleware: LoggerMiddleware runs first for all api/v1 routes (see configure()).
 * - controllers/providers: AppController, AppService (health, root).
 *
 * Request pipeline: Middleware → Guard → Interceptor → Pipe → Controller (see doc/back-end-guide.md).
 *
 * @see https://docs.nestjs.com/modules
 * @see doc/back-end-guide.md §4 (Import/Export)
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TodosModule } from './todos/todos.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { BacktestModule } from './backtest/backtest.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ...(process.env.REDIS_ENABLED === 'true'
      ? [
        CacheModule.registerAsync({
          isGlobal: true,
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => {
            const store = await redisStore({
              socket: {
                host: config.get('REDIS_HOST', 'localhost'),
                port: config.get('REDIS_PORT', 6379),
              },
              password: config.get('REDIS_PASSWORD') || undefined,
              ttl: config.get('REDIS_TTL_MS', 60_000),
            });
            return { store };
          },
        }),
      ]
      : [CacheModule.register({ isGlobal: true })]),
    AuthModule,
    UsersModule,
    TodosModule,
    BacktestModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
