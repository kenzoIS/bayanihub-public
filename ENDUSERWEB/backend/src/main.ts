import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes: /api/v1/*
  app.setGlobalPrefix('api/v1');

  // Enable CORS for development
  app.enableCors({
    origin: true, // Allow all origins for debugging
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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
  await app.listen(port);
  console.log(`🚀 BayaniHub API running on http://localhost:${port}/api/v1`);
}

bootstrap();
