import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccessControlModule } from 'common/guards/access-control/access-control.module';
import { UserModule } from 'user/user.module';
import { MailModule } from './../common/mail/mail.module';
import { IsExist } from './../common/utils/validators/is-exists.validator';
import { IsNotExist } from './../common/utils/validators/is-not-exists.validator';
import { SharedModule } from './../shared/shared.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ExternalOidcController } from './external-oidc/external-oidc.controller';
import { ExternalOidcService } from './external-oidc/external-oidc.service';
import { ForgotModule } from './forgot/forgot.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { EmailStrategy } from './strategies/email.strategy';
import { ExternalOidcStrategy } from './strategies/external-oidc.strategy';
import { TwoFactorModule } from './two-factor/two-factor.module';

@Module({
  imports: [
    SharedModule,
    forwardRef(() => UserModule),
    ForgotModule,
    PassportModule,
    forwardRef(() => MailModule),
    forwardRef(() => TwoFactorModule),
    forwardRef(() => AccessControlModule),
    HttpModule,
  ],
  controllers: [AuthController, ExternalOidcController],
  providers: [
    IsExist,
    IsNotExist,
    ApiKeyStrategy,
    EmailStrategy,
    ExternalOidcStrategy,
    AuthService,
    ExternalOidcService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
