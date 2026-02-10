import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCheck,
  lucideChevronRight,
  lucideX,
} from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
  ReCaptchaV3Service,
} from 'ng-recaptcha-2';
import { firstValueFrom } from 'rxjs';
import {
  HlmButtonDirective,
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmIconComponent,
  HlmToasterService,
  passwordFormGroup,
  phoneFormGroup,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';
import { PrivacyPolicyComponent } from '../../components/legal/privacy-policy';
import { TermsOfUseComponent } from '../../components/legal/terms-of-use';
import { UserFormComponent } from '../../components/user-form/user-form';
import { mergeFormGroups } from '../../shared/utils/merge-form-groups';
import { SignUpApi } from './services/sign-up-api';

export type ApiFieldErrors = Record<string, string>;

@Component({
  selector: 'app-sign-up',
  standalone: true,
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideCheck,
      lucideChevronRight,
      lucideX,
    }),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  imports: [
    CommonModule,
    RouterModule,
    HlmButtonDirective,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmIconComponent,
    ReactiveFormsModule,
    TranslateModule,
    RecaptchaV3Module,
    TermsOfUseComponent,
    PrivacyPolicyComponent,
    UserFormComponent,
  ],
  templateUrl: './sign-up.html',
  styleUrls: ['./sign-up.scss'],
})
export class SignUp implements OnInit {
  currentStep = signal<1 | 2>(1);
  currentTermIndex = signal<number>(0);
  termCountdown = signal<number>(0);
  canAcceptTerm = signal<boolean>(true);
  loading = signal<boolean>(false);
  noOfficialAddress = signal<boolean>(false);

  private api = inject(SignUpApi);
  private router = inject(Router);
  private recaptchaV3Service = inject(ReCaptchaV3Service);
  private toaster = inject(HlmToasterService);
  private translate = inject(TranslateService);

  terms = environment.terms;

  formGroup = mergeFormGroups(
    new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      socialName: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
      cpf: new FormControl('', [Validators.required]),
      address: new FormGroup({
        cep: new FormControl(''),
        street: new FormControl(''),
        number: new FormControl(''),
        complement: new FormControl(''),
        neighborhood: new FormControl(''),
        city: new FormControl(''),
        state: new FormControl(''),
      }),
      digitalAddress: new FormControl(''),
      phoneCountry: new FormControl('+55'),
      recaptcha: new FormControl('', []),
      termsAccepted: new FormControl<string[]>([]),
    }),
    passwordFormGroup(),
    phoneFormGroup({ required: false }),
  );

  ngOnInit() {
    const govBrTokensStr = localStorage.getItem('govBrTokens');
    if (govBrTokensStr) {
      const govBrTokens = JSON.parse(govBrTokensStr);
      const fiveMinutes = 5 * 60 * 1000;

      if (
        govBrTokens.timestamp &&
        Date.now() - govBrTokens.timestamp > fiveMinutes
      ) {
        localStorage.removeItem('govBrTokens');
        return;
      }

      setTimeout(() => {
        this.toaster.show(
          this.translate.instant('pages.signIn.notifications.welcomeGovBr'),
          { type: 'info' },
        );
      }, 500);
      const { idToken, userData } = govBrTokens;

      if (userData) {
        this.formGroup.patchValue({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
      } else {
        const decodedToken: any = this.decodeToken(idToken);
        if (decodedToken) {
          if (decodedToken.email) {
            this.formGroup.patchValue({ email: decodedToken.email });
          }
          if (decodedToken.name) {
            const parts = decodedToken.name.split(' ');
            this.formGroup.patchValue({
              firstName: parts[0],
              lastName: parts.slice(1).join(' '),
            });
          }
        }
      }
    }
  }

  private decodeToken(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const pastedText = event.clipboardData?.getData('text/plain');

    if (pastedText) {
      this.formGroup.controls['email'].setValue(pastedText.replace(/\s/g, ''));
    }
  }

  resolveCaptcha(value: string | null) {
    if (!value) return;
    this.formGroup.get('recaptcha')?.setValue(value);
  }

  private startTermCountdown() {
    this.canAcceptTerm.set(false);
    this.termCountdown.set(5);
    const interval = setInterval(() => {
      this.termCountdown.update((v) => v - 1);
      if (this.termCountdown() <= 0) {
        this.canAcceptTerm.set(true);
        clearInterval(interval);
      }
    }, 1000);
  }

  private extractFieldErrors(err: unknown): ApiFieldErrors | null {
    if (!(err instanceof HttpErrorResponse)) return null;

    const errors = err.error?.errors;

    if (!errors || typeof errors !== 'object') {
      return null;
    }

    return errors as ApiFieldErrors;
  }

  nextStep() {
    const controlsToValidate = [
      'firstName',
      'lastName',
      'email',
      'password',
      'confirmPassword',
      'cpf',
    ];

    let isStep1Valid = true;
    for (const name of controlsToValidate) {
      const control = this.formGroup.get(name);
      if (control?.invalid) {
        control.markAsTouched();
        isStep1Valid = false;
      }
    }

    if (!isStep1Valid) {
      this.toaster.error(
        this.translate.instant('pages.signUp.errors.invalidForm'),
      );
      return;
    }

    this.currentStep.set(2);
    this.startTermCountdown();
  }

  prevStep() {
    this.currentStep.set(1);
  }

  get currentTerm() {
    return this.terms[this.currentTermIndex()];
  }

  acceptCurrentTerm() {
    if (!this.canAcceptTerm()) return;

    const termId = this.currentTerm.id;
    const currentAccepted = this.formGroup.get('termsAccepted')?.value || [];
    if (!currentAccepted.includes(termId)) {
      this.formGroup
        .get('termsAccepted')
        ?.setValue([...currentAccepted, termId]);
    }

    if (this.currentTermIndex() < this.terms.length - 1) {
      this.currentTermIndex.update((i) => i + 1);
      this.startTermCountdown();
    } else {
      this.submit();
    }
  }

  async submit() {
    if (this.formGroup.invalid) {
      this.toaster.error(
        this.translate.instant('pages.signUp.errors.invalidForm'),
      );
      return;
    }

    if (
      this.formGroup.get('termsAccepted')?.value?.length !== this.terms.length
    ) {
      this.toaster.error(
        this.translate.instant('pages.signUp.errors.termsRequired'),
      );
      return;
    }

    this.loading.set(true);
    this.currentStep.set(1); // Close terms modal while loading

    try {
      const captcha = await firstValueFrom(
        this.recaptchaV3Service.execute('signup'),
      );
      this.resolveCaptcha(captcha);

      const rawValue = this.formGroup.getRawValue();

      // Combine phone
      let phone: string | null = null;
      if (rawValue.phone) {
        const cleanPhone = rawValue.phone.replace(/\D/g, '');
        phone = rawValue.phoneCountry + cleanPhone;
      }

      const payload = {
        ...rawValue,
        phone,
        address: !this.noOfficialAddress()
          ? JSON.stringify(rawValue.address)
          : null,
        digitalAddress: this.noOfficialAddress()
          ? rawValue.digitalAddress
          : null,
      };

      // Remove phoneCountry from payload
      delete (payload as any).phoneCountry;

      await firstValueFrom(this.api.register(payload));

      const govBrTokens = localStorage.getItem('govBrTokens');
      if (govBrTokens) {
        localStorage.setItem('govBrFinalize', 'true');
      }

      this.router.navigate(['/sign-in']);
    } catch (err: unknown) {
      let errorTranslation = this.translate.instant(
        'pages.signUp.errors.submit',
      );
      const fieldErrors = this.extractFieldErrors(err);
      if (fieldErrors) {
        const [field, code] = Object.entries(fieldErrors)[0];

        const localTranslationKey = `pages.signUp.errors.${field}.${code}`;
        const localTranslation = this.translate.instant(localTranslationKey);

        if (localTranslation !== localTranslationKey) {
          errorTranslation = localTranslation;
        }
      }
      console.error('Registration error:', err);
      this.toaster.error(errorTranslation);
    } finally {
      this.loading.set(false);
    }
  }
}
