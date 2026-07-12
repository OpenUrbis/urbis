import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SendGridModule } from "@ntegral/nestjs-sendgrid";
import mailConfig from "./../config/mail.config";
import { MailService } from "./mail.service";

@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    SendGridModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        apiKey: cfg.get("mail.sendGridApiKey"),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
