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
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  useContainer(app.select(module), { fallbackOnErrors: true });

  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new GoogleRecaptchaFilter());
}
