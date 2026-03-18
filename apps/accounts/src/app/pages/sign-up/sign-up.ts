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
import { differenceInYears } from 'date-fns';
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
  HlmIconComponent,
  HlmToasterService,
  passwordFormGroup,
  phoneFormGroup,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';
import {
  ACCOUNT_TYPE_ENUM,
  ACCOUNT_TYPES,
} from '../../components/user-form/user-form';
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
    HlmCardDirective,
    HlmCardContentDirective,
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
      birthDate: new FormControl('', [Validators.required]),
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
  );
  formValue = toSignal(this.formGroup.valueChanges);
  birthDateValue = toSignal(this.formGroup.get('birthDate')!.valueChanges);

  constructor() {
    effect(() => {
      const birthDate = this.birthDateValue();
      if (birthDate) {
        const age = differenceInYears(new Date(), new Date(birthDate));

        let newType: string;
        if (age >= 18) {
          newType = ACCOUNT_TYPE_ENUM.FISICA_CAPAZ;
        } else if (age >= 16 && age < 18) {
          newType = ACCOUNT_TYPE_ENUM.FISICA_EMANCIPADA;
        } else {
          newType = ACCOUNT_TYPE_ENUM.FISICA_ASSISTIDO_PARENTAL;
        }

        const currentType = this.formGroup.get('accountType')?.value;

        if (currentType !== newType) {
          this.formGroup.get('accountType')?.setValue(newType);
        }
      }
    });
  }

  async govBrLogin() {
    if (window.location.hostname !== 'conta.urbis.sampa.br') {
      // Create mock data for development environments
      localStorage.setItem(
        'govBrTokens',
        JSON.stringify({
          idToken: 'mock_id_token',
          accessToken: 'mock_access_token',
          userData: {
            email: 'dev@urbis.sampa.br',
            firstName: 'Usuário',
            lastName: 'de Teste',
            cpf: '12236731035',
            birthDate: '1990-01-01',
          },
          timestamp: Date.now(),
        }),
      );
      this.checkGovBrData();
      return;
    }

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

      const { idToken, userData } = govBrTokens;

      this.hasGovBrData.set(true);

      if (userData) {
        const partsName = userData.name.split(' ');
        this.formGroup.patchValue({
          email: userData.email,
          firstName: partsName[0],
          lastName: partsName.slice(1).join(' '),
          cpf: userData.preferred_username || '',
          socialName: userData.social_name || '',
          birthDate: userData.birth_date || '',
          phone: userData.phone_number || '',
          avatar: userData.picture || '',
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

      // Desabilita campos se dados preenchidos pelo gov.br
      if (this.formGroup.get('email')?.value)
        this.formGroup.get('email')?.disable();
      if (this.formGroup.get('firstName')?.value)
        this.formGroup.get('firstName')?.disable();
      if (this.formGroup.get('lastName')?.value)
        this.formGroup.get('lastName')?.disable();
      if (this.formGroup.get('cpf')?.value)
        this.formGroup.get('cpf')?.disable();
      if (this.formGroup.get('birthDate')?.value)
        this.formGroup.get('birthDate')?.disable();
    } else {
      this.hasGovBrData.set(false);
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
        if (this.formGroup.get('digitalAddress')?.invalid) {
          this.formGroup.get('digitalAddress')?.markAsTouched();
          this.toaster.error('Preencha o endereço digital');
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

      const payload = {
        ...rawValue,
        accountType: rawValue.accountType,
        phone,
        address: !this.noOfficialAddress()
          ? JSON.stringify(rawValue.address)
          : null,
        digitalAddress: this.noOfficialAddress()
          ? rawValue.digitalAddress
          : null,
      };

      await firstValueFrom(this.api.register(payload));

      const govBrTokens = localStorage.getItem('govBrTokens');
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
