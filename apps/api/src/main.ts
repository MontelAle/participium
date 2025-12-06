import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import passport from 'passport';
import { DataSource } from 'typeorm';
import pkg from '../package.json';
import { AppModule } from './app.module';
import { seedDatabase } from './providers/database/seed/participium.seed';
import { MinioProvider } from './providers/minio/minio.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(passport.initialize());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Participium API')
    .setVersion(pkg.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 5000);

  // Run seed after application is fully initialized and listening
  // This ensures MinioProvider.onModuleInit() has completed
  try {
    const dataSource = app.get(DataSource);
    const minioProvider = app.get(MinioProvider);

    if (dataSource.isInitialized) {
      console.log('Starting database seed...');
      await seedDatabase(dataSource, minioProvider);
    }
  } catch (error) {
    console.error('Auto-seeding failed:', error);
  }
}

void bootstrap();
