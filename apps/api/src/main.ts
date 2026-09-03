import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import commonBootstrap from './common/bootstrap';
import { setupSwagger } from './swagger';

/**
 * Boots up the application.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const jsonParser = json({ limit: '2000mb' });
  const urlencodedParser = urlencoded({ extended: true, limit: '2000mb' });

  app.use((req, res, next) => {
    // Let oidc-provider handle its own raw streams for its mounted endpoints
    if (
      req.path.startsWith('/auth/oidc') &&
      !req.path.includes('/interaction/login') &&
      !req.path.includes('/interaction/validate2fa')
    ) {
      return next();
    }
    jsonParser(req, res, (err) => {
      if (err) return next(err);
      urlencodedParser(req, res, next);
    });
  });

  const configService = app.get(ConfigService);
  app.set('trust proxy', configService.get('app.trustProxy'));

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
