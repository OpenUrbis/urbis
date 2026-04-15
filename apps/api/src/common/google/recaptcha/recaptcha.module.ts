import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';

@Module({
  imports: [
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('reacaptcha'),
      inject: [ConfigService],
    }),
  ],
  exports: [GoogleRecaptchaModule],
})
export class RecaptchaModule {}
