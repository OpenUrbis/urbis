import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TwoFactorModule } from 'auth/two-factor/two-factor.module';
import { MailModule } from 'common/mail/mail.module';
import { SharedModule } from 'shared/shared.module';
import { oidcProviderFactory } from '../../common/factories/oidc-provider.factory';
import { AuthService } from './../../auth/auth.service';
import { AuthModule } from './../auth.module';
import { ApplicationsModule } from './clients/clients.module';
import { ClientsService } from './clients/clients.service';
import { OidcController } from './oidc.controller';

@Module({
  imports: [
    ApplicationsModule,
    AuthModule,
    PassportModule,
    SharedModule,
    TwoFactorModule,
    forwardRef(() => MailModule),
  ],
  controllers: [OidcController],
  providers: [
    {
      provide: 'OidcProvider',
      useFactory: oidcProviderFactory,
      inject: [ConfigService, ClientsService, AuthService],
    },
  ],
})
export class OidcModule {}
