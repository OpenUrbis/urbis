import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG_ID } from '../auth.config';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButtonDirective, HlmIconComponent } from '../../../public-api';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader2 } from '@ng-icons/lucide';

@Component({
  selector: 'lib-callback',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    HlmButtonDirective,
    HlmIconComponent,
  ],
  providers: [provideIcons({ lucideLoader2 })],
  templateUrl: './callback.html',
})
export class Callback implements OnInit {
  errorMessage: any;
  loading = true;

  oidcSecurityService = inject(OidcSecurityService);
  router = inject(Router);

  async ngOnInit() {
    // If it's a popup flow, let the built-in library postMessage logic handle the response
    // to the parent window. Running checkAuthMultiple here in the popup window will
    // throw "could not find matching config for state" since sessionStorage is isolated.
    if (window.opener && window !== window.opener) {
      this.loading = true;
      this.errorMessage = null;
      return;
    }

    try {
      const checkedAuths = await firstValueFrom(
        this.oidcSecurityService.checkAuthMultiple(),
      );

      checkedAuths.forEach(async (auth) => {
        const { isAuthenticated, userData, errorMessage, configId } = auth;
        console.log('AUTH', auth);

        if (configId !== AUTH_CONFIG_ID) {
          // It's the external OIDC flow (e.g. Gov.br),
          // authorizeWithPopUp relies on the library handling the popup auto-close logic
          // as long as checkAuthMultiple finishes. We can just return here to not navigate
          // the popup away, letting the library close it.
          return;
        }

        if (isAuthenticated) {
          this.router.navigate(['/']);
          return;
        }
        if (userData === null) {
          this.loading = false;
          this.errorMessage = 'We were unable to retrieve your username';
        }
        if (errorMessage) {
          this.loading = false;
          this.errorMessage = errorMessage;
        }
      });
    } catch (err: any) {
      console.error(err);

      this.errorMessage = err.message ?? 'You have invalid callback session';
    }
  }
}
