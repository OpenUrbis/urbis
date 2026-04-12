import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { JwtStrategy } from 'auth/strategies/jwt.strategy';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import adminConfig from './../common/config/admin.config';
import appConfig from './../common/config/app.config';
import authConfig from './../common/config/auth.config';
import databaseConfig from './../common/config/database.config';
import geocodingConfig from './../common/config/geocoding.config';
import recaptchaConfig from './../common/config/recaptcha.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        adminConfig,
        appConfig,
        authConfig,
        databaseConfig,
        geocodingConfig,
        recaptchaConfig,
      ],
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

    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('reacaptcha'),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtStrategy, JwtModule],
})
export class SharedModule {}
