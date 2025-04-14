import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiKeyStrategy } from '../common/strategies/api-key.strategy';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import appConfig from './../common/config/app.config';
import authConfig from './../common/config/auth.config';
import databaseConfig from './../common/config/database.config';
import geocodingConfig from 'common/config/geocoding.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, geocodingConfig],
      envFilePath: ['.env'],
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('app.fallbackLanguage'),
        loaderOptions: {
          path: join(configService.get('app.i18nDirectory')),
          watch: false,
        },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService) => {
            return [
              configService.get('app.headerLanguage') ?? 'en',
            ] as string[];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [ApiKeyStrategy],
  exports: [ApiKeyStrategy],
})
export class SharedModule {}
