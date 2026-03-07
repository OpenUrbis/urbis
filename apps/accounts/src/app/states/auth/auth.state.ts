import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private oidc = inject(OidcSecurityService);
  isAuthenticated = toSignal(this.oidc.isAuthenticated(), {
    initialValue: false,
  });
}
