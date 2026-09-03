import {
  ClassSerializerInterceptor,
  DynamicModule,
  INestApplication,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule } from 'app.module';
import { useContainer } from 'class-validator';
import { GoogleRecaptchaFilter } from './google/recaptcha/recaptcha.filter';
import validationOptions from './utils/validation-options';
/**
 * Core bootstrap module should be loaded here.
 * @param app
 *
 */

export default function commonBootstrap(
  app: INestApplication,
  module: DynamicModule | Type<unknown> = AppModule,
) {
  const allowedOrigins = [
    'https://urbis.prefeitura.sp.gov.br',
    'https://conta.urbis.prefeitura.sp.gov.br',
    'https://mapa.urbis.prefeitura.sp.gov.br',
    'https://accounts.mapa.urbis.prefeitura.sp.gov.br',
    'https://api.mapa.urbis.prefeitura.sp.gov.br',
    'https://legis.urbis.prefeitura.sp.gov.br',
    'https://viabiliza.urbis.prefeitura.sp.gov.br',
    'https://docs.urbis.prefeitura.sp.gov.br',
    'http://localhost:3000',
    'http://localhost:3010',
    'http://localhost:4200',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser clients (and same-origin requests) do not send Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.prefeitura.sp.gov.br') ||
        origin.endsWith('.urbis.prefeitura.sp.gov.br') ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Organization-Id',
      'recaptcha',
    ],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    optionsSuccessStatus: 204,
  });

  useContainer(app.select(module), { fallbackOnErrors: true });

  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new GoogleRecaptchaFilter());
}
