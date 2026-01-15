import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import commonBootstrap from '../../common/bootstrap';
import { Worker } from '../../common/decorators/worker.decorator';
import { setupSwagger } from '../../swagger';

async function bootstrapCoreWorker() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  const configService = app.get(ConfigService);

  // Enable Swagger documentation
  if (configService.get('app.swaggerEnabled') === 'true') {
    setupSwagger(app);
  }

  // Common bootstrap
  commonBootstrap(app, AppModule);

  app
    .getHttpAdapter()
    .getInstance()
    .get('/health', (_req, res) => {
      res.status(200).send({
        statusCode: 200,
        message: 'OK',
      });
    });

  await app.listen(Number(configService.get('app.port')), '0.0.0.0');
  console.log(
    'Core Worker HTTP rodando em: http://localhost:' +
      configService.get('app.port'),
  );
}

@Worker({
  name: 'core',
  description: 'Core worker for handling all routes',
  path: 'core',
  isRoot: true,
})
class CoreWorkerServer {
  constructor() {
    void bootstrapCoreWorker();
  }
}
new CoreWorkerServer();
