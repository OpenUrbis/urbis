import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import commonBootstrap from './common/bootstrap';
import { setupSwagger } from './swagger';

/**
 * Boots up the application.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable Swagger documentation
  if (configService.get('app.swaggerEnabled') === 'true') {
    setupSwagger(app);
  }

  // Common bootstrap
  commonBootstrap(app);

  await app.listen(configService.get('app.port'));
  console.info('Running in: http://localhost:' + configService.get('app.port'));
}
void bootstrap();
