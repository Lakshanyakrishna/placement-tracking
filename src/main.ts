import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    snapshot: true,
  });

  const configService = app.get(AppConfigService);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  app.use(cookieParser());

  app.enableCors({
    origin: configService.app.corsOrigin || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
      },
    }),
  );

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('St. Mary\'s Career Hub')
    .setDescription('API for managing certifications, placements, internships, and career readiness tracking')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const publicDir = join(__dirname, '..', 'public');
  if (existsSync(publicDir)) {
    const { static: serveStatic } = await import('express');
    app.use(serveStatic(publicDir));
    const indexPath = join(publicDir, 'index.html');
    if (existsSync(indexPath)) {
      const indexContent = readFileSync(indexPath, 'utf-8');
      app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.type('text/html').send(indexContent);
      });
    }
    logger.log(`Serving static files from ${publicDir}`);
  } else {
    logger.warn('public directory not found — not serving frontend');
  }

  const port = process.env.PORT || configService.app.port || 3000;
  await app.listen(port);

  logger.log(`Application started on port ${port}`);
  logger.log(`Environment: ${configService.app.environment || 'development'}`);
  logger.log(`Health endpoint: http://localhost:${port}/api/v1/health`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
