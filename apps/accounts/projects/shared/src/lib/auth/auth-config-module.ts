import { NgModule } from '@angular/core';
import { AuthModule } from 'angular-auth-oidc-client';
import { authConfig, externalOidcAuthConfig } from './auth.config';

@NgModule({
  declarations: [],
  imports: [
    AuthModule.forRoot({
      config: [authConfig, externalOidcAuthConfig],
    }),
  ],
})
export class AuthConfigModule {}
