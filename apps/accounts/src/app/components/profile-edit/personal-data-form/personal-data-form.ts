import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileState } from '../../../states/profile/profile.state';
import { ProfileEditApi } from '../services/profile-edit-api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { decode } from '@open-urbis/endereco-digital';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import { lucideMap, lucideChevronDown } from '@ng-icons/lucide';
import { HlmIconComponent, HlmSwitchComponent } from '../../../../../projects/shared/src/public-api';
import {
  countrySelectFormGroup,
  phoneFormGroup,
  PhoneFormGroup,
  CountrySelectFormGroup,
  HlmInputDirective,
  HlmLabelDirective,
  HlmButtonDirective
} from '../../../../../projects/shared/src/public-api';
import { mergeFormGroups } from '../../../shared/utils/merge-form-groups';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-personal-data-form',
  providers: [provideIcons({ lucideMap, lucideChevronDown })],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PhoneFormGroup,
    CountrySelectFormGroup,
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective,
    HlmIconComponent,
    HlmSwitchComponent
  ],
  templateUrl: './personal-data-form.html',
})
export class PersonalDataForm {
  api = inject(ProfileEditApi);
  state = inject(ProfileState);
  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  noOfficialAddress = signal<boolean>(false);
  loadingCep = signal<boolean>(false);
  digitalAddressError = signal<string | null>(null);
  private digitalAddressSubject = new Subject<string>();

  form = mergeFormGroups(
    new FormGroup({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      socialName: new FormControl(''),
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
    }),
    phoneFormGroup(),
    countrySelectFormGroup(),
  );

  constructor() {
    this.digitalAddressSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.validateDigitalAddress(value);
      });

    effect(() => {
      const value = this.state.value();
      if (!value.id || this.state.loading()) return;

      if (value.digitalAddress) {
        this.noOfficialAddress.set(true);
      }

      if (value.address) {
        try {
          const addressData = JSON.parse(value.address);
          this.form.patchValue({ address: addressData });
        } catch (e) {
          // Fallback if not JSON
        }
      }

      this.form.patchValue({
        ...value,
      });
    });
  }

  onDigitalAddressInput(event: any) {
    const value = event.target.value.toUpperCase();
    this.digitalAddressSubject.next(value);
  }

  private validateDigitalAddress(value: string) {
    if (!value) {
      this.digitalAddressError.set(null);
      this.form.get('digitalAddress')?.setErrors(null);
      return;
    }

    let cleanValue = value.trim();
    const base27Regex = /^[23456789BCDFGHJKLMNPQTVWXYZ]{7}$/;
    const rawCode = cleanValue.replace(/[\s-]/g, '');
    
    if (base27Regex.test(rawCode)) {
      cleanValue = `-23-46 ${rawCode.substring(0, 3)}-${rawCode.substring(3)}`;
      this.form.get('digitalAddress')?.setValue(cleanValue, { emitEvent: false });
    }

    try {
      decode(cleanValue);
      this.digitalAddressError.set(null);
      this.form.get('digitalAddress')?.setErrors(null);
    } catch (e) {
      try {
        const parts = cleanValue.split(' ');
        if (parts.length === 2) {
           const normalized = parts[0] + " " + parts[1].replace('-', '');
           decode(normalized);
           this.digitalAddressError.set(null);
           this.form.get('digitalAddress')?.setErrors(null);
           return;
        }
        throw e;
      } catch (innerE) {
        const errorMsg = this.translate.instant('pages.signUp.errors.invalidDigitalAddress');
        this.digitalAddressError.set(errorMsg);
        this.form.get('digitalAddress')?.setErrors({ invalidDigitalAddress: true });
      }
    }
  }

  async checkCep() {
    let cep = this.form.get('address.cep')?.value?.replace(/\D/g, '') || '';
    if (cep.length > 8) cep = cep.substring(0, 8);
    
    if (cep.length > 5) {
      this.form.get('address.cep')?.setValue(`${cep.substring(0, 5)}-${cep.substring(5)}`, { emitEvent: false });
    } else {
      this.form.get('address.cep')?.setValue(cep, { emitEvent: false });
    }

    if (cep.length !== 8) return;

    this.loadingCep.set(true);
    try {
      const data: any = await firstValueFrom(
        this.http.get(`https://viacep.com.br/ws/${cep}/json/`),
      );
      if (!data.erro) {
        this.form.patchValue({
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

  submit() {
    if (this.form.invalid) return;

    const rawValue = this.form.getRawValue();
    const payload = {
      ...rawValue,
      address: !this.noOfficialAddress() ? JSON.stringify(rawValue.address) : null,
      digitalAddress: this.noOfficialAddress() ? rawValue.digitalAddress : null,
    };

    this.api.patchMe(payload as any).subscribe(() => this.state.refresh());
  }
}
