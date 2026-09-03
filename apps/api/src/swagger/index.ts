import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication) => {
  const config = app.get(ConfigService);
  const options = new DocumentBuilder()
    .setTitle(config.get('app.name'))
    .setDescription(`API Documentation for ${config.get('app.name')}`)
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: config.get<string>('auth.apiKeyHeader', 'X-API-Key'),
        in: 'header',
      },
      'api_key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
