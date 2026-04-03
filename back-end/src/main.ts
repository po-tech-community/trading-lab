/**
 * Application ENTRY POINT – bootstrap (main.ts).
 *
 * Request pipeline order: 1) Middleware (LoggerMiddleware) 2) Guard (e.g. JwtAuthGuard) 3) Interceptor
 * (LoggingInterceptor – logs every request/response) 4) Pipe (ValidationPipe) 5) Controller.
 *
 * What it does: Creates app, global prefix "api/v1", LoggingInterceptor, ValidationPipe, Swagger at /api/docs,
 * listens on PORT (default 8000). Set JWT_SECRET in .env for auth.
 *
 * Run: npm run start:dev from back-end/. API: http://localhost:8000/api/v1, Swagger: http://localhost:8000/api/docs.
 *
 * @see https://docs.nestjs.com/first-steps
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(cookieParser());

  const normalizeOrigin = (value: string): string => value.replace(/\/$/, '');
  const configuredOrigin = normalizeOrigin(
    config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000'),
  );

  const port = config.get('PORT', 8000);
  // Swagger UI sends requests from the same host as the server, so we must allow it explicitly.
  const swaggerOrigin = `http://localhost:${port}`;

  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow non-browser requests (no Origin header), then enforce exact normalized origin match.
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      const allowed = [configuredOrigin, swaggerOrigin];
      if (allowed.includes(normalizeOrigin(requestOrigin))) {
        callback(null, true);
        return;
      }

      callback(
        new Error(`Origin ${requestOrigin} is not allowed by CORS`),
        false,
      );
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Trading Lab API')
    .setDescription(
      'DCA Simulator & AI Advisor – backtest, portfolio, triggers, AI.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);


  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
