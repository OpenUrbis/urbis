import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule } from 'app.module';
import { useContainer } from 'class-validator';
import { json, urlencoded } from 'express';
import validationOptions from './utils/validation-options';
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

  app.use(json({ limit: '2000mb' }));
  app.use(urlencoded({ extended: true, limit: '2000mb' }));
}
