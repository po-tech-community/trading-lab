/**
 * Auth feature MODULE – register, login, JWT issue and validation.
 *
 * Pipeline (for students):
 * 1. Middleware (optional): e.g. raw body parser, request id (see main.ts / app.module).
 * 2. Guard: JwtAuthGuard on protected routes; @Public() skips it (auth routes, or specific GETs).
 * 3. Interceptor: LoggingInterceptor logs every request/response (see main.ts).
 * 4. Pipe: ValidationPipe validates DTOs (body, query) globally in main.ts.
 * 5. Controller: AuthController (register, login), others use JwtAuthGuard.
 *
 * imports: JwtModule (to sign tokens), PassportModule (for JwtStrategy).
 * providers: AuthService, JwtStrategy. JwtStrategy is used by JwtAuthGuard (in other modules).
 *
 * @see doc/developer-tasks.md L0-BE-*
 * @see doc/back-end-guide.md §4, §5
 * @see https://docs.nestjs.com/security/authentication
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
