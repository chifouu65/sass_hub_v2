/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.enableCors({
    origin: true, // Autoriser tout en dev
    credentials: true,
  });
  app.use((req, res, next) => {
    Logger.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
  });
  app.setGlobalPrefix(globalPrefix);
  const port = Number(process.env.DEEPNEWS_PORT || 3333);
  await app.listen(port);
  Logger.log(
    `🚀 DeepNews Backend running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
