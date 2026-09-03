import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCheck } from '@ng-icons/lucide';
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
  HlmIconComponent,
  HlmToasterService,
  passwordFormGroup,
  phoneFormGroup,
  countrySelectFormGroup,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';
import { ACCOUNT_TYPES } from '../../components/user-form/user-form';
import {
  allowedAccountTypesForBirthDate,
  defaultAccountTypeForBirthDate,
} from '../../shared/utils/account-type-eligibility';
import { validBirthDate } from '../../shared/utils/birth-date.validator';
import { mergeFormGroups } from '../../shared/utils/merge-form-groups';
import { SignUpApi } from './services/sign-up-api';
import { AccountTypeComponent } from './steps/account-type/account-type.component';
import { AddressComponent } from './steps/address/address.component';
import { DocumentsComponent } from './steps/documents/documents.component';
import { PasswordComponent } from './steps/password/password.component';
import { PersonalDataComponent } from './steps/personal-data/personal-data.component';
import { TermsComponent } from './steps/terms/terms.component';

export type ApiFieldErrors = Record<string, string>;

@Component({
  selector: 'app-sign-up',
  standalone: true,
  providers: [
    provideIcons({
      lucideCheck,
      lucideArrowLeft,
    }),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  imports: [
    CommonModule,
    RouterModule,
    HlmIconComponent,
    HlmButtonDirective,
    ReactiveFormsModule,
    TranslateModule,
    RecaptchaV3Module,
    TermsComponent,
    AccountTypeComponent,
    PersonalDataComponent,
    AddressComponent,
    DocumentsComponent,
    PasswordComponent,
  ],
  templateUrl: './sign-up.html',
  styleUrls: ['./sign-up.scss'],
})
export class SignUp {
  currentStep = signal<1 | 2 | 3 | 4 | 5 | 6>(1);
  currentTermIndex = signal<number>(0);
  termCountdown = signal<number>(0);
  canAcceptTerm = signal<boolean>(false);
  loading = signal<boolean>(false);
  noOfficialAddress = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  accountTypes = ACCOUNT_TYPES;

  selectedAccountType = signal<{
    value: string;
    label: string;
    allow: boolean;
  } | null>(null);
  scrolledToBottom = signal<boolean>(false);
  hasGovBrData = signal<boolean>(false);

  private api = inject(SignUpApi);
  private recaptchaV3Service = inject(ReCaptchaV3Service);
  private toaster = inject(HlmToasterService);
  private translate = inject(TranslateService);
  private oidcSecurityService = inject(OidcSecurityService);

  terms = environment.terms;

  formGroup = mergeFormGroups(
    new FormGroup({
      avatar: new FormControl(''),
      accountType: new FormControl('fisica_capaz', [Validators.required]),
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      birthDate: new FormControl('', [Validators.required, validBirthDate]),
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
      metadata: new FormGroup({
        documents: new FormControl(null),
      }),
    }),
    passwordFormGroup(),
    phoneFormGroup({ required: false }),
    countrySelectFormGroup(),
  );
  formValue = toSignal(this.formGroup.valueChanges);
  birthDateValue = toSignal(this.formGroup.get('birthDate')!.valueChanges);

  constructor() {
    effect(() => {
      const birthDate = this.birthDateValue();
      if (birthDate && this.formGroup.get('birthDate')?.valid) {
        const allowedTypes = allowedAccountTypesForBirthDate(birthDate);
        const currentType = this.formGroup.get('accountType')?.value;

        if (!allowedTypes.includes(currentType)) {
          this.formGroup
            .get('accountType')
            ?.setValue(defaultAccountTypeForBirthDate(birthDate));
        }
      }
    });
  }

  async govBrLogin() {
    try {
      const { idToken, isAuthenticated, accessToken } = await firstValueFrom(
        this.oidcSecurityService.authorizeWithPopUp(
          undefined,
          undefined,
          EXTERNAL_OIDC_AUTH_CONFIG_ID,
        ),
      );

      if (isAuthenticated) {
        // Just decode token/data and store in localStorage to simulate existing behavior
        const decodedToken: any = this.decodeToken(idToken);
        localStorage.setItem(
          'govBrTokens',
          JSON.stringify({
            idToken,
            accessToken,
            userData: decodedToken, // basic mapping
            timestamp: Date.now(),
          }),
        );
        this.checkGovBrData();
      }
    } catch (err) {
      console.error('Error on sign in with gov br', err);
      this.toaster.error('Erro ao fazer login com gov.br. Tente novamente.');
    }
  }

  checkGovBrData() {
    const govBrTokensStr = localStorage.getItem('govBrTokens');
    if (govBrTokensStr) {
      const govBrTokens = JSON.parse(govBrTokensStr);
      console.log('govBrTokens', govBrTokens);
      const fiveMinutes = 5 * 60 * 1000;

      if (
        govBrTokens.timestamp &&
        Date.now() - govBrTokens.timestamp > fiveMinutes
      ) {
        localStorage.removeItem('govBrTokens');
        this.hasGovBrData.set(false);
        return;
      }

      const { userData } = govBrTokens;
      console.log('userData', userData);

      if (userData) {
        this.hasGovBrData.set(true);
        const { firstName, lastName } = this.splitGovBrFullName(userData.name);
        this.formGroup.patchValue({
          email: userData.email,
          firstName,
          lastName,
          cpf: userData.preferred_username || '',
          socialName: userData.social_name || '',
          birthDate: userData.birth_date || '',
          phone: userData.phone_number || '',
          avatar: userData.picture || '',
        });
      } else {
        this.toaster.error(
          'Não foi possível recuperar as informações do Gov.BR, tente novamente',
        );
        this.hasGovBrData.set(false);
        return;
      }

      // Mantém o e-mail editável para que a pessoa escolha o endereço do Urbis.
      if (this.formGroup.get('firstName')?.value)
        this.formGroup.get('firstName')?.disable();
      if (this.formGroup.get('lastName')?.value)
        this.formGroup.get('lastName')?.disable();
      if (this.formGroup.get('cpf')?.value)
        this.formGroup.get('cpf')?.disable();
      if (this.formGroup.get('birthDate')?.value)
        this.formGroup.get('birthDate')?.disable();
    } else {
      this.toaster.error(
        'Não foi possível recuperar as informações do Gov.BR, tente novamente',
      );
      this.hasGovBrData.set(false);
    }
  }

  private splitGovBrFullName(value?: string) {
    const particles = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);
    const parts = (value ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part, index) => {
        const normalized =
          part.charAt(0).toLocaleUpperCase('pt-BR') +
          part.slice(1).toLocaleLowerCase('pt-BR');
        return index > 0 && particles.has(normalized.toLocaleLowerCase('pt-BR'))
          ? normalized.toLocaleLowerCase('pt-BR')
          : normalized;
      });

    const [firstName = '', ...lastNameParts] = parts;
    return { firstName, lastName: lastNameParts.join(' ') };
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
    } catch {
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

  onTermsScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      this.scrolledToBottom.set(true);
      this.canAcceptTerm.set(true);
    }
  }

  nextStep(step: 1 | 2 | 3 | 4 | 5 | 6) {
    if (this.currentStep() === 4) {
      // Validate Address
      if (!this.noOfficialAddress()) {
        const addr = this.formGroup.get('address') as FormGroup;
        if (addr.invalid) {
          addr.markAllAsTouched();
          this.toaster.error('Preencha o endereço corretamente');
          return;
        }
      } else {
        const addr = this.formGroup.get('address') as FormGroup;
        const digitalAddressControl = this.formGroup.get('digitalAddress');
        if (digitalAddressControl?.invalid || addr?.invalid) {
          digitalAddressControl?.markAsTouched();
          addr?.markAllAsTouched();
          this.toaster.error(
            'Preencha o endereço digital e as informações de endereço corretamente',
          );
          return;
        }
      }
    }

    if (this.currentStep() === 5) {
      // Basic document requirement validation (though handled by child component disable state, double check here)
      const type = this.formGroup.get('accountType')?.value;
      const needsDocument = [
        'fisica_emancipada',
        'fisica_assistido_parental',
        'fisica_assistido_tutor',
      ].includes(type);
      if (needsDocument && !this.formGroup.get('metadata.documents')?.value) {
        this.toaster.error(
          'Faça o upload do documento obrigatório para continuar',
        );
        return;
      }
    }

    this.currentStep.set(step);
  }

  prevStep() {
    if (this.currentStep() > 1 && this.currentStep() <= 3) {
      // "não pode haver retorno após a terceira etapa"
      this.currentStep.set((this.currentStep() - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    } else if (this.currentStep() > 3) {
      this.currentStep.set((this.currentStep() - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  }

  get currentTerm() {
    return this.terms[this.currentTermIndex()];
  }

  acceptCurrentTerm() {
    this.nextStep(2);
  }

  async submit() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.toaster.error(
        this.translate.instant('pages.signUp.errors.invalidForm'),
      );
      return;
    }

    this.loading.set(true);

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

      const govBrTokens = localStorage.getItem('govBrTokens');

      const payload = {
        ...rawValue,
        accountType: rawValue.accountType,
        phone,
        address: JSON.stringify({
          ...rawValue.address,
          ...(this.noOfficialAddress()
            ? { cep: null, street: null, number: null }
            : {}),
        }),
        digitalAddress: this.noOfficialAddress()
          ? rawValue.digitalAddress
          : null,
      };

      await firstValueFrom(this.api.register(payload));

      if (govBrTokens) {
        localStorage.setItem('govBrFinalize', 'true');
      }

      const requiresAnalysis = [
        'fisica_emancipada',
        'fisica_assistido_parental',
        'fisica_assistido_tutor',
      ].includes(rawValue.accountType);

      if (requiresAnalysis) {
        this.successMessage.set(
          this.translate.instant('pages.signUp.success.inAnalysis'),
        );
      } else {
        this.successMessage.set(
          this.translate.instant('pages.signUp.success.default'),
        );
      }
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
