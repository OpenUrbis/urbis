import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
  ReCaptchaV3Service,
} from 'ng-recaptcha-2';
import { firstValueFrom } from 'rxjs';
import { EXTERNAL_OIDC_AUTH_CONFIG_ID } from '../../../../projects/shared/src/lib/auth/auth.config';
import {
  HlmButtonDirective,
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmInputDirective,
  HlmLabelDirective,
  HlmToasterService,
  SignInGovBrBtn,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';
import { SignInApi } from './services/sign-in-api';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HlmInputDirective,
    HlmButtonDirective,
    HlmLabelDirective,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardFooterDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    ReactiveFormsModule,
    TranslateModule,
    RecaptchaV3Module,
    SignInGovBrBtn,
  ],
  providers: [
    HttpClient,
    SignInApi,
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  templateUrl: './sign-in.html',
  styleUrls: ['./sign-in.scss'],
})
export class SignIn implements OnInit {
  formGroup = new FormGroup({
    email: new FormControl('test@test.com', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('Teste@1234', [Validators.required]),
    recaptcha: new FormControl('', []),
  });
  isEmailNotConfirmed = signal<boolean>(false);
  disableSubmit = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  hasLoginError = signal<boolean>(false);

  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  signInService = inject(SignInApi);
  oidcSecurityService = inject(OidcSecurityService);
  private recaptchaV3Service = inject(ReCaptchaV3Service);
  private toaster = inject(HlmToasterService);
  private translate = inject(TranslateService);

  ngOnInit() {
    this.validateSession();
    if (localStorage.getItem('redirect-to-sign-up')) {
      localStorage.removeItem('redirect-to-sign-up');
      this.router.navigate(['sign-up']);
    }
    if (localStorage.getItem('govBrFinalize')) {
      localStorage.removeItem('govBrFinalize');
      setTimeout(() => {
        this.toaster.show(
          this.translate.instant('pages.signIn.notifications.finalizeGovBr'),
          { type: 'info' },
        );
      }, 500);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const pastedText = event.clipboardData?.getData('text/plain');

    if (pastedText) {
      this.formGroup.controls.email.setValue(pastedText.replace(/\s/g, ''));
    }
  }

  validateSession() {
    this.activatedRoute.queryParams.subscribe(({ clientId, session }) => {
      if (clientId !== undefined && session !== undefined) {
        this.signInService.storeSession(clientId, session);
      }
      if (this.signInService.haveStoredSession()) {
        this.signInService.trySession().subscribe({
          error: () => {
            this.router.navigate(['/']);
          },
        });
        return;
      }
      this.router.navigate(['/']);
    });
  }

  async signInWithExternalOidc() {
    try {
      const { idToken, isAuthenticated, accessToken, ...all } =
        await firstValueFrom(
          this.oidcSecurityService.authorizeWithPopUp(
            undefined,
            undefined,
            EXTERNAL_OIDC_AUTH_CONFIG_ID,
          ),
        );
      console.log('all', all);
      console.log('accessToken', accessToken);

      if (isAuthenticated) {
        this.resolveCaptcha(
          await firstValueFrom(this.recaptchaV3Service.execute('signin')),
        );

        console.log('formGroup.value', this.formGroup.value);

        try {
          const response = await firstValueFrom(
            this.signInService.authenticate({
              idToken,
              accessToken,
              recaptcha: this.formGroup.value.recaptcha,
            }),
          );

          this.redirectOnSuccess(response);
        } catch (err: any) {
          if (err.status === 400 && err.error?.isEmailNotConfirmed) {
            this.isEmailNotConfirmed.set(true);
            this.disableSubmit.set(true);

            setTimeout(() => {
              this.disableSubmit.set(false);
            }, 5000);
            return;
          }
          if (err.status === 401 && err.error?.message === 'USER_NOT_FOUND') {
            localStorage.setItem(
              'govBrTokens',
              JSON.stringify({
                idToken,
                accessToken,
                userData: err.error.data,
                timestamp: Date.now(),
              }),
            );
            this.toaster.show(
              this.translate.instant('pages.signIn.errors.userNotFound'),
              { type: 'info' },
            );
            this.router.navigate(['/sign-up']);
            return;
          }
          this.toaster.error(
            this.translate.instant('pages.signIn.errors.submit'),
          );
          throw err;
        }
      }
    } catch (err) {
      console.error('Error on sign in with another provider', err);
    }
  }

  resolveCaptcha(value: string | null) {
    if (!value) return;
    this.formGroup.get('recaptcha')?.setValue(value);
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.hasLoginError.set(false);
    this.formGroup.controls.email.setValue(
      this.formGroup.controls.email.value?.replace(/\s/g, '') ?? '',
      { emitEvent: false },
    );

    this.resolveCaptcha(
      await firstValueFrom(this.recaptchaV3Service.execute('signin')),
    );

    console.log('formGroup.value', this.formGroup.value);

    this.signInService.authenticate(this.formGroup.value).subscribe({
      error: (err) => {
        this.isLoading.set(false);
        console.error(err);

        if (err.status === 400 && err.error?.isEmailNotConfirmed) {
          this.isEmailNotConfirmed.set(true);
          this.disableSubmit.set(true);

          setTimeout(() => {
            this.disableSubmit.set(false);
          }, 5000);
          return;
        }

        this.hasLoginError.set(true);
      },
      next: (res: any) => {
        this.isLoading.set(false);
        this.redirectOnSuccess(res);
      },
    });
  }

  redirectOnSuccess({
    redirectToCallback,
    otpValidated,
    requires2fa,
    accessToken,
  }: any) {
    if (!requires2fa && redirectToCallback)
      return (location.href = redirectToCallback);

    this.router.navigate(['/two-factor'], {
      queryParams: { otpValidated, requires2fa, accessToken },
    });
  }
}
