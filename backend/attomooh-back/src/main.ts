import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import dns from 'node:dns';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

// ── Force Node.js to use Google DNS (fixes SRV resolution issues) ──
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ── Global Pipes ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global Filters ──
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Global Interceptors ──
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Security Headers ──
  app.use(helmet());
  // ── CORS ──
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  );
  const vercelPreviewPattern = /^https:\/\/[_\w-]+\.vercel\.app$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, Render health check)
      if (!origin) return callback(null, true);

      // Allow the configured frontend URL (set via FRONTEND_URL env var)
      if (origin === frontendUrl) return callback(null, true);

      // Allow Vercel production and preview deployments
      if (vercelPreviewPattern.test(origin)) return callback(null, true);

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

void bootstrap();
