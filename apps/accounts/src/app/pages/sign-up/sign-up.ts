import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  HlmButtonDirective,
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmInputDirective,
  HlmLabelDirective,
  HlmIconComponent,
  HlmSwitchComponent,
} from '../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideMap, lucideChevronDown, lucideCheck, lucideChevronRight, lucideX } from '@ng-icons/lucide';
import { HlmToasterService } from '../../../../projects/shared/src/public-api';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
  ReCaptchaV3Service,
} from 'ng-recaptcha-2';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  PasswordFormGroup,
  passwordFormGroup,
  phoneFormGroup,
  PhoneFormGroup,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';
import { mergeFormGroups } from '../../shared/utils/merge-form-groups';
import { SignInApi } from '../sign-in/services/sign-in-api';
import { SignUpApi } from './services/sign-up-api';
import { HttpClient } from '@angular/common/http';
import { decode } from '@open-urbis/numeracao-digital';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TermsOfUseComponent } from '../../components/legal/terms-of-use';
import { PrivacyPolicyComponent } from '../../components/legal/privacy-policy';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  providers: [
    provideIcons({ lucideArrowLeft, lucideMap, lucideChevronDown, lucideCheck, lucideChevronRight, lucideX }),
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  imports: [
    CommonModule,
    RouterModule,
    HlmInputDirective,
    HlmButtonDirective,
    HlmLabelDirective,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmIconComponent,
    ReactiveFormsModule,
    PasswordFormGroup,
    PhoneFormGroup,
    TranslateModule,
    RecaptchaV3Module,
    HlmSwitchComponent,
    TermsOfUseComponent,
    PrivacyPolicyComponent,
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
  loadingCep = signal<boolean>(false);
  digitalAddressError = signal<string | null>(null);
  
  private digitalAddressSubject = new Subject<string>();

  private api = inject(SignUpApi);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private signInService = inject(SignInApi);
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
    this.digitalAddressSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.validateDigitalAddress(value);
      });
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

  onDigitalAddressInput(event: any) {
    const value = event.target.value.toUpperCase();
    this.digitalAddressSubject.next(value);
  }

  private validateDigitalAddress(value: string) {
    if (!value) {
      this.digitalAddressError.set(null);
      this.formGroup.get('digitalAddress')?.setErrors(null);
      return;
    }

    // 1. Pre-process input: remove extra spaces and ensure standard format for internal validation
    let cleanValue = value.trim();
    
    // If only 7 characters are provided and they are valid Base27, assume SP prefix
    const base27Regex = /^[23456789BCDFGHJKLMNPQTVWXYZ]{7}$/;
    const rawCode = cleanValue.replace(/[\s-]/g, '');
    
    if (base27Regex.test(rawCode)) {
      cleanValue = `-23-46 ${rawCode.substring(0, 3)}-${rawCode.substring(3)}`;
      // Update form value with the assumed prefix for better visibility
      this.formGroup.get('digitalAddress')?.setValue(cleanValue, { emitEvent: false });
    }

    try {
      // 2. Decode using the package logic
      decode(cleanValue);
      this.digitalAddressError.set(null);
      this.formGroup.get('digitalAddress')?.setErrors(null);
    } catch (e) {
      // 3. If standard decode fails, try a more aggressive normalization
      try {
        // Try replacing hyphen with space in the code part if it exists
        const parts = cleanValue.split(' ');
        if (parts.length === 2) {
           const normalized = parts[0] + " " + parts[1].replace('-', '');
           decode(normalized);
           this.digitalAddressError.set(null);
           this.formGroup.get('digitalAddress')?.setErrors(null);
           return;
        }
        throw e;
      } catch (innerE) {
        const errorMsg = this.translate.instant('pages.signUp.errors.invalidDigitalAddress');
        this.digitalAddressError.set(errorMsg);
        this.formGroup.get('digitalAddress')?.setErrors({ invalidDigitalAddress: true });
      }
    }
  }

  onPhoneInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (this.formGroup.get('phoneCountry')?.value === '+55') {
      if (value.length > 11) value = value.substring(0, 11);
      if (value.length > 10) {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
      } else if (value.length > 6) {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
      } else if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      }
    }
    this.formGroup.get('phone')?.setValue(value, { emitEvent: false });
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

  async checkCep() {
    let cep = this.formGroup.get('address.cep')?.value?.replace(/\D/g, '') || '';
    if (cep.length > 8) cep = cep.substring(0, 8);
    
    // Apply mask
    if (cep.length > 5) {
      this.formGroup.get('address.cep')?.setValue(`${cep.substring(0, 5)}-${cep.substring(5)}`, { emitEvent: false });
    } else {
      this.formGroup.get('address.cep')?.setValue(cep, { emitEvent: false });
    }

    if (cep.length !== 8) return;

    this.loadingCep.set(true);
    try {
      const data: any = await firstValueFrom(
        this.http.get(`https://viacep.com.br/ws/${cep}/json/`),
      );
      if (!data.erro) {
        this.formGroup.patchValue({
          address: {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching CEP', error);
    } finally {
      this.loadingCep.set(false);
    }
  }

  private startTermCountdown() {
    this.canAcceptTerm.set(false);
    this.termCountdown.set(5);
    const interval = setInterval(() => {
      this.termCountdown.update(v => v - 1);
      if (this.termCountdown() <= 0) {
        this.canAcceptTerm.set(true);
        clearInterval(interval);
      }
    }, 1000);
  }

  nextStep() {
    const controlsToValidate = [
      'firstName',
      'lastName',
      'email',
      'password',
      'confirmPassword',
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
      this.toaster.error(this.translate.instant('pages.signUp.errors.invalidForm'));
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
      this.formGroup.get('termsAccepted')?.setValue([...currentAccepted, termId]);
    }

    if (this.currentTermIndex() < this.terms.length - 1) {
      this.currentTermIndex.update(i => i + 1);
      this.startTermCountdown();
    } else {
      this.submit();
    }
  }

  async submit() {
    if (this.formGroup.invalid) {
       this.toaster.error(this.translate.instant('pages.signUp.errors.invalidForm'));
       return;
    }
    
    if (this.formGroup.get('termsAccepted')?.value?.length !== this.terms.length) {
      this.toaster.error(this.translate.instant('pages.signUp.errors.termsRequired'));
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
      const payload = {
        ...rawValue,
        address: !this.noOfficialAddress() ? JSON.stringify(rawValue.address) : null,
        digitalAddress: this.noOfficialAddress() ? rawValue.digitalAddress : null,
      };

      await firstValueFrom(this.api.register(payload));

      const govBrTokens = localStorage.getItem('govBrTokens');
      if (govBrTokens) {
        localStorage.setItem('govBrFinalize', 'true');
      }

      this.router.navigate(['/sign-in']);
    } catch (err) {
      console.error('Registration error:', err);
      this.toaster.error(this.translate.instant('pages.signUp.errors.submit'));
    } finally {
      this.loading.set(false);
    }
  }
}
