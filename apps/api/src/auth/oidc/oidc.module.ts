import { Module } from '@nestjs/common';
import { OidcController } from './oidc.controller';
import { oidcProviderFactory } from '../../common/factories/oidc-provider.factory';
import { ApplicationsModule } from './clients/clients.module';
import { AuthModule } from './../auth.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ClientsService } from './clients/clients.service';
import { AuthService } from './../../auth/auth.service';
import { SharedModule } from 'shared/shared.module';
import { TwoFactorModule } from 'auth/two-factor/two-factor.module';

@Module({
  imports: [
    ApplicationsModule,
    AuthModule,
    PassportModule,
    SharedModule,
    TwoFactorModule,
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
