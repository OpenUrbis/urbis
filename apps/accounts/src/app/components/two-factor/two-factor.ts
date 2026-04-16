import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AUTH_CONFIG_ID } from '../../../../projects/shared/src/lib/auth/auth.config';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { SignInApi } from '../../pages/sign-in/services/sign-in-api';
import { TwoFactorSetup } from './components/two-factor-setup/two-factor-setup';
import { TwoFactorVerify } from './components/two-factor-verify/two-factor-verify';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-two-factor',
  imports: [
    TwoFactorSetup,
    TwoFactorVerify,
    MatCardModule,
    LoadingContent,
    NgTemplateOutlet,
    TranslateModule,
  ],
  templateUrl: './two-factor.html',
  styleUrl: './two-factor.scss',
})
export class TwoFactor implements OnInit {
  accessToken = input<string | undefined>(undefined);
  otpValidated = input<boolean>(false);
  onlyContent = input<boolean>(false);
  verified = output<boolean>();

  step = signal<number>(0);

  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  oidcSecurityService = inject(OidcSecurityService);
  signInService = inject(SignInApi);

  queryParams = toSignal<any>(this.activatedRoute.queryParams);

  constructor() {
    effect(() => {
      const queryParams = this.queryParams();
      const { otpValidated, accessToken } = queryParams;

      if (!accessToken && !this.accessToken())
        this.oidcSecurityService.authorize(AUTH_CONFIG_ID);

      if ((otpValidated && otpValidated !== 'false') || this.otpValidated())
        this.step.set(1);
    });
  }

  ngOnInit(): void {
    if (!this.accessToken()) this.validateSession();
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
