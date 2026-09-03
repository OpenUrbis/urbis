import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AUTH_CONFIG_ID } from '../../../../projects/shared/src/lib/auth/auth.config';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private oidc = inject(OidcSecurityService);
  isAuthenticated = toSignal(this.oidc.isAuthenticated(AUTH_CONFIG_ID), {
    initialValue: false,
  });

  logout() {
    this.oidc.logoff();
  }
}
