import { NgModule } from '@angular/core';
import { AuthModule } from 'angular-auth-oidc-client';
import { authConfig } from './auth.config';

@NgModule({
  declarations: [],
  imports: [AuthModule.forRoot(authConfig)],
})
export class AuthConfigModule {}
