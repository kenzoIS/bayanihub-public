import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes: /api/v1/*
  app.setGlobalPrefix('api/v1');

  // Enable CORS for the frontend origin
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe — strips unknown properties from DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip properties not in the DTO
      forbidNonWhitelisted: true, // throw if unknown properties are sent
      transform: true,          // auto-transform payloads to DTO instances
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`BayaniHub API running on http://0.0.0.0:${port}/api/v1`);
}

bootstrap();

