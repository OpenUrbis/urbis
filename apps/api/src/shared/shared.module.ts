import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'auth/strategies/jwt.strategy';
import geocodingConfig from 'common/config/geocoding.config';
import mapsConfig from 'common/config/maps.config';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import appConfig from './../common/config/app.config';
import authConfig from './../common/config/auth.config';
import databaseConfig from './../common/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, geocodingConfig, mapsConfig],
      envFilePath: ['.env'],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.expires') ?? 30 * 24 * 60 * 60, // 30 days,
        },
      }),
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
    PassportModule,
  ],
  providers: [JwtStrategy],
  exports: [JwtStrategy, JwtModule],
})
export class SharedModule {}
