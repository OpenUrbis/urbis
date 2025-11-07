import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { LoadingContent } from '../../../../../projects/shared/src/public-api';
import { SignInApi } from '../services/sign-in-api';
import { TwoFactorSetup } from './components/two-factor-setup/two-factor-setup';
import { TwoFactorVerify } from './components/two-factor-verify/two-factor-verify';

@Component({
  selector: 'app-two-factor',
  imports: [TwoFactorSetup, TwoFactorVerify, MatCardModule, LoadingContent],
  templateUrl: './two-factor.html',
  styleUrl: './two-factor.scss',
})
export class TwoFactor implements OnInit {
  step = signal<number>(0);

  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  oidcSecurityService = inject(OidcSecurityService);
  signInService = inject(SignInApi);

  queryParams = toSignal<any>(this.activatedRoute.queryParams);

  constructor() {
    effect(() => {
      const queryParams = this.queryParams();
      if (!queryParams) return;
      const { otpValidated, requires2fa, accessToken } = queryParams;

      if (!accessToken) this.oidcSecurityService.authorize();

      if (otpValidated !== 'false') this.step.set(1);
    });
  }

  ngOnInit(): void {
    this.validateSession();
  }

  validateSession() {
    if (this.signInService.haveStoredSession()) {
      this.signInService.trySession().subscribe({
        error: () => {
          this.router.navigate(['/']);
        },
      });
      return;
    }
    this.router.navigate(['/']);
  }
}
