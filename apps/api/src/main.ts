import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import commonBootstrap from './common/bootstrap';
import { setupSwagger } from './swagger';

/**
 * Boots up the application.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '2000mb' }));
  app.use(urlencoded({ extended: true, limit: '2000mb' }));

  const configService = app.get(ConfigService);

  // Enable Swagger documentation
  // if (configService.get('app.swaggerEnabled') === 'true') {
  setupSwagger(app);
  // }

  // Common bootstrap
  commonBootstrap(app, AppModule);

  await app.listen(configService.get('app.port'));
  console.info('Running in: http://localhost:' + configService.get('app.port'));
}
void bootstrap();
