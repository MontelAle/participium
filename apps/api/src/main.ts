import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pkg from '../package.json';
import { AppModule } from './app.module';
import passport from 'passport';
import { DataSource } from 'typeorm';
import { seedDatabase } from './providers/database/seed/user.seed';

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

  try {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await seedDatabase(dataSource);
    }
  } catch (error) {
    console.error('Auto-seeding failed:', error);
  }

  await app.listen(process.env.PORT || 5000);
}

void bootstrap();
