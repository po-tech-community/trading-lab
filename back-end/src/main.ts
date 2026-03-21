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

  app.enableCors({
    origin: config.get<string>('FRONTEND_ORIGIN'),
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
    .setDescription('DCA Simulator & AI Advisor – backtest, portfolio, triggers, AI.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get('PORT', 8000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
