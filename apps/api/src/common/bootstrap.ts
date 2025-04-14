import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import validationOptions from './utils/validation-options';
import { Reflector } from '@nestjs/core';
import { AppModule } from 'app.module';
/**
 * Core bootstrap module should be loaded here.
 * @param app
 *
 */

export default function commonBootstrap(app: INestApplication) {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}
