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
  HlmIconComponent,
  HlmInputDirective,
  HlmLabelDirective,
  HlmSwitchComponent,
} from '../../../../projects/shared/src/public-api';

export const ACCOUNT_TYPES = [
  {
    value: 'fisica_capaz',
    label: 'Pessoa física capaz (não emancipada)',
    allow: true,
  },
  {
    value: 'fisica_emancipada',
    label: 'Pessoa física capaz (emancipada)',
    allow: true,
  },
  {
    value: 'fisica_assistido_parental',
    label:
      'Pessoa física Relativamente incapaz (assistido por autoridade parental)',
    allow: true,
  },
  {
    value: 'fisica_assistido_tutor',
    label: 'Pessoa física Relativamente incapaz (assistido por tutor)',
    allow: true,
  },
  {
    value: 'fisica_representado_parental',
    label: 'Pessoa física Incapaz (representado por autoridade parental)',
    allow: false,
  },
  {
    value: 'fisica_representado_tutor',
    label: 'Pessoa física Incapaz (representado por tutor)',
    allow: false,
  },
  {
    value: 'fisica_representado_curador',
    label: 'Pessoa física Incapaz (representado por curador)',
    allow: false,
  },
  { value: 'espolio', label: 'Espólio', allow: false },
  { value: 'heranca', label: 'Herança jacente ou vacante', allow: false },
  { value: 'juridica', label: 'Pessoa jurídica', allow: false },
  { value: 'massa_falida', label: 'Massa falida', allow: false },
  {
    value: 'massa_insolvente',
    label: 'Massa do insolvente civil',
    allow: false,
  },
  { value: 'condominio', label: 'Condomínio edilício', allow: false },
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
  accountTypes = ACCOUNT_TYPES.filter((t) => t.allow);
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
      // Digital Address Mode: Address fields optional, Digital Address required
      if (addressGroup) {
        Object.keys(addressGroup.controls).forEach((key) => {
          const control = addressGroup.get(key);
          control?.clearValidators();
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
      } catch (innerE) {
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
