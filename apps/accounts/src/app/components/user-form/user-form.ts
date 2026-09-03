import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideMap } from '@ng-icons/lucide';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { decode } from '@open-urbis/endereco-digital';

import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PasswordFormGroup } from '../../../../projects/shared/src/lib/components/password-form-group/password-form-group';
import {
  allowedAccountTypesForBirthDate,
  defaultAccountTypeForBirthDate,
} from '../../shared/utils/account-type-eligibility';
import {
  HlmIconComponent,
  HlmInputDirective,
  HlmLabelDirective,
  HlmSwitchComponent,
} from '../../../../projects/shared/src/public-api';

export enum ACCOUNT_TYPE_ENUM {
  FISICA_CAPAZ = 'fisica_capaz',
  FISICA_EMANCIPADA = 'fisica_emancipada',
  FISICA_ASSISTIDO_PARENTAL = 'fisica_assistido_parental',
  FISICA_ASSISTIDO_TUTOR = 'fisica_assistido_tutor',
  FISICA_REPRESENTADO_PARENTAL = 'fisica_representado_parental',
  FISICA_REPRESENTADO_TUTOR = 'fisica_representado_tutor',
  FISICA_REPRESENTADO_CURADOR = 'fisica_representado_curador',
  ESPOLIO = 'espolio',
  HERANCA = 'heranca',
  JURIDICA = 'juridica',
  MASSA_FALIDA = 'massa_falida',
  MASSA_INSOLVENTE = 'massa_insolvente',
  CONDOMINIO = 'condominio',
}

export const ACCOUNT_TYPES = [
  {
    value: ACCOUNT_TYPE_ENUM.FISICA_CAPAZ,
    label: 'Pessoa física capaz',
    allow: true,
    minAge: 18,
  },
  {
    value: ACCOUNT_TYPE_ENUM.FISICA_EMANCIPADA,
    label: 'Pessoa física capaz (emancipada)',
    allow: true,
    minAge: 16,
    maxAge: 18,
  },
  {
    value: ACCOUNT_TYPE_ENUM.FISICA_ASSISTIDO_PARENTAL,
    label: 'Pessoa física assistida por autoridade parental',
    allow: true,
    maxAge: 18,
  },
  {
    value: ACCOUNT_TYPE_ENUM.FISICA_ASSISTIDO_TUTOR,
    label: 'Pessoa física assistida por tutor',
    allow: true,
    maxAge: 18,
  },
  {
    value: ACCOUNT_TYPE_ENUM.FISICA_REPRESENTADO_PARENTAL,
    label: 'Pessoa física representado por autoridade parental',
    allow: false,
  },
  {
    value: ACCOUNT_TYPE_ENUM.FISICA_REPRESENTADO_TUTOR,
    label: 'Pessoa física representado por tutor',
    allow: false,
  },
  {
    value: ACCOUNT_TYPE_ENUM.FISICA_REPRESENTADO_CURADOR,
    label: 'Pessoa física representado por curador',
    allow: false,
  },
  { value: ACCOUNT_TYPE_ENUM.ESPOLIO, label: 'Espólio', allow: false },
  {
    value: ACCOUNT_TYPE_ENUM.HERANCA,
    label: 'Herança jacente ou vacante',
    allow: false,
  },
  { value: ACCOUNT_TYPE_ENUM.JURIDICA, label: 'Pessoa jurídica', allow: false },
  {
    value: ACCOUNT_TYPE_ENUM.MASSA_FALIDA,
    label: 'Massa falida',
    allow: false,
  },
  {
    value: ACCOUNT_TYPE_ENUM.MASSA_INSOLVENTE,
    label: 'Massa do insolvente civil',
    allow: false,
  },
  {
    value: ACCOUNT_TYPE_ENUM.CONDOMINIO,
    label: 'Condomínio edilício',
    allow: false,
  },
];

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HlmInputDirective,
    HlmLabelDirective,
    HlmIconComponent,
    HlmSwitchComponent,
    PasswordFormGroup,
  ],
  providers: [
    provideIcons({
      lucideMap,
      lucideChevronDown,
    }),
  ],
  templateUrl: './user-form.html',
})
export class UserFormComponent implements OnInit, OnDestroy {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input() allowAllAccountTypes = false;
  accountTypes = ACCOUNT_TYPES;
  @Input() loading = false;

  displayMode = input();

  private _noOfficialAddress = false;
  @Input()
  set noOfficialAddress(value: boolean) {
    this._noOfficialAddress = value;
    this.updateAddressValidators();
  }
  get noOfficialAddress() {
    return this._noOfficialAddress;
  }

  @Output() noOfficialAddressChange = new EventEmitter<boolean>();

  loadingCep = signal<boolean>(false);
  digitalAddressError = signal<string | null>(null);

  private digitalAddressSubject = new Subject<string>();
  private sub = new Subscription();
  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  get allowedAccountTypes() {
    if (this.allowAllAccountTypes) return ACCOUNT_TYPES.map((type) => type.value);
    const birthDate = this.formGroup.get('birthDate')?.value;
    if (!birthDate || this.formGroup.get('birthDate')?.invalid) return [];
    return allowedAccountTypesForBirthDate(birthDate);
  }

  get hasEmail() {
    return !!this.formGroup.get('email');
  }

  get hasCpf() {
    return !!this.formGroup.get('cpf');
  }

  get hasPassword() {
    return !!this.formGroup.get('password');
  }

  get hasPhoneCountry() {
    return !!this.formGroup.get('phoneCountry');
  }

  get passwordFormGroup(): FormGroup {
    const passwordControl = this.formGroup.get('password');
    if (passwordControl instanceof FormGroup) {
      return passwordControl;
    }
    return this.formGroup;
  }

  ngOnInit() {
    this.sub.add(
      this.digitalAddressSubject
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe((value) => {
          this.validateDigitalAddress(value);
        }),
    );

    const birthDateControl = this.formGroup.get('birthDate');
    if (birthDateControl) {
      const updateAccountType = (birthDate: string) => {
        if (!birthDate || birthDateControl.invalid) return;

        // If the accountType control is disabled (e.g., in edit mode), do not overwrite the loaded value
        if (this.formGroup.get('accountType')?.disabled) return;

        const allowedTypes = allowedAccountTypesForBirthDate(birthDate);
        const currentType = this.formGroup.get('accountType')?.value;
        if (!allowedTypes.includes(currentType)) {
          this.formGroup
            .get('accountType')
            ?.setValue(defaultAccountTypeForBirthDate(birthDate));
        }
      };

      // Run once initially if birthDate is already set
      if (birthDateControl.value) {
        updateAccountType(birthDateControl.value);
      }

      this.sub.add(
        birthDateControl.valueChanges.subscribe((value) => {
          updateAccountType(value);
        }),
      );
    }

    // Ensure validators are set initially (in case input setter ran before formGroup was available)
    this.updateAddressValidators();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private updateAddressValidators() {
    if (!this.formGroup) return;

    const addressGroup = this.formGroup.get('address') as FormGroup;
    const digitalAddressControl = this.formGroup.get('digitalAddress');

    if (this.noOfficialAddress) {
      // Digital Address Mode: CEP, street, number optional; neighborhood, city, state, and digitalAddress required
      if (addressGroup) {
        const requiredFields = ['neighborhood', 'city', 'state'];
        Object.keys(addressGroup.controls).forEach((key) => {
          const control = addressGroup.get(key);
          if (requiredFields.includes(key)) {
            control?.setValidators([Validators.required]);
          } else {
            control?.clearValidators();
          }
          control?.updateValueAndValidity();
        });
      }

      digitalAddressControl?.setValidators([Validators.required]);
      digitalAddressControl?.updateValueAndValidity();
    } else {
      // Official Address Mode: Address fields required (except complement), Digital Address optional
      if (addressGroup) {
        const requiredFields = [
          'cep',
          'street',
          'number',
          'neighborhood',
          'city',
          'state',
        ];
        Object.keys(addressGroup.controls).forEach((key) => {
          const control = addressGroup.get(key);
          if (requiredFields.includes(key)) {
            control?.setValidators([Validators.required]);
          } else {
            control?.clearValidators();
          }
          control?.updateValueAndValidity();
        });
      }

      digitalAddressControl?.clearValidators();
      digitalAddressControl?.updateValueAndValidity();
    }
  }

  toggleNoOfficialAddress(value: boolean) {
    this.noOfficialAddress = value;
    this.noOfficialAddressChange.emit(value);
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

    let cleanValue = value.trim();
    const base27Regex = /^[23456789BCDFGHJKLMNPQTVWXYZ]{7}$/;
    const rawCode = cleanValue.replace(/[\s-]/g, '');

    if (base27Regex.test(rawCode)) {
      cleanValue = `-23-46 ${rawCode.substring(0, 3)}-${rawCode.substring(3)}`;
      this.formGroup
        .get('digitalAddress')
        ?.setValue(cleanValue, { emitEvent: false });
    }

    try {
      decode(cleanValue);
      this.digitalAddressError.set(null);
      this.formGroup.get('digitalAddress')?.setErrors(null);
    } catch (e) {
      try {
        const parts = cleanValue.split(' ');
        if (parts.length === 2) {
          const normalized = parts[0] + ' ' + parts[1].replace('-', '');
          decode(normalized);
          this.digitalAddressError.set(null);
          this.formGroup.get('digitalAddress')?.setErrors(null);
          return;
        }
        throw e;
      } catch (_innerE: any) {
        const errorMsg = this.translate.instant(
          'pages.signUp.errors.invalidDigitalAddress',
        );
        this.digitalAddressError.set(errorMsg);
        this.formGroup
          .get('digitalAddress')
          ?.setErrors({ invalidDigitalAddress: true });
      }
    }
  }

  onPhoneInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    const phoneCountry = this.formGroup.get('phoneCountry')?.value;

    // Save pure numbers only if formatting
    const rawValue = value;

    if (phoneCountry === '+55') {
      if (value.length > 11) value = value.substring(0, 11);
      if (value.length > 10) {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
      } else if (value.length > 6) {
        value = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
      } else if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      }
    }

    // Fixed typo: pone -> phone
    this.formGroup.get('phone')?.setValue(value, { emitEvent: false });
  }

  onCpfInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    if (value.length > 9) {
      value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9)}`;
    } else if (value.length > 6) {
      value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
    } else if (value.length > 3) {
      value = `${value.substring(0, 3)}.${value.substring(3)}`;
    }

    this.formGroup.get('cpf')?.setValue(value, { emitEvent: false });
  }

  async checkCep() {
    let cep =
      this.formGroup.get('address.cep')?.value?.replace(/\D/g, '') || '';
    if (cep.length > 8) cep = cep.substring(0, 8);

    if (cep.length > 5) {
      this.formGroup
        .get('address.cep')
        ?.setValue(`${cep.substring(0, 5)}-${cep.substring(5)}`, {
          emitEvent: false,
        });
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


}
