import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Strips unknown fields and validates every incoming DTO automatically.
  // Non-negotiable for a fintech app -- never trust raw client input.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors(); // tighten this to your app's actual origin before production

  const port = process.env.PORT || 3000;
  // Explicitly bind to 0.0.0.0 (all network interfaces) -- Railway's external
  // proxy can't reach the app if it only binds to localhost/IPv6-only, which
  // is the most common cause of "Application failed to respond" on Railway
  // even when the app itself logs a clean, successful startup.
  await app.listen(port, '0.0.0.0');
  console.log(`PayTrack backend running on port ${port}`);
}
bootstrap();
