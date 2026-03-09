import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'user/user.module';
import { MailModule } from './../common/mail/mail.module';
import { IsExist } from './../common/utils/validators/is-exists.validator';
import { IsNotExist } from './../common/utils/validators/is-not-exists.validator';
import { SharedModule } from './../shared/shared.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForgotModule } from './forgot/forgot.module';
import { EmailStrategy } from './strategies/email.strategy';
import { TwoFactoryModule } from './two-factory/two-factory.module';

@Module({
  imports: [
    SharedModule,
    UserModule,
    ForgotModule,
    PassportModule,
    MailModule,
    TwoFactoryModule,
  ],
  controllers: [AuthController],
  providers: [IsExist, IsNotExist, EmailStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
