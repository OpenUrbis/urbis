import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideMap } from '@ng-icons/lucide';
import { TranslateModule } from '@ngx-translate/core';
import {
  countrySelectFormGroup,
  CountrySelectFormGroup,
  HlmButtonDirective,
} from '../../../../../projects/shared/src/public-api';
import { mergeFormGroups } from '../../../shared/utils/merge-form-groups';
import { ProfileState } from '../../../states/profile/profile.state';
import { UserFormComponent } from '../../user-form/user-form';
import { ProfileEditApi } from '../services/profile-edit-api';

const ADMIN_ROLE_ID = 'f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4';

@Component({
  standalone: true,
  selector: 'app-personal-data-form',
  providers: [provideIcons({ lucideMap, lucideChevronDown })],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    CountrySelectFormGroup,
    HlmButtonDirective,
    UserFormComponent,
  ],
  templateUrl: './personal-data-form.html',
})
export class PersonalDataForm {
  api = inject(ProfileEditApi);
  state = inject(ProfileState);

  isAdmin = signal(false);
  noOfficialAddress = signal<boolean>(false);

  form = mergeFormGroups(
    new FormGroup({
      firstName: new FormControl({ value: '', disabled: true }, Validators.required),
      lastName: new FormControl({ value: '', disabled: true }, Validators.required),
      birthDate: new FormControl({ value: '', disabled: true }),
      socialName: new FormControl(''),
      cpf: new FormControl({ value: '', disabled: true }, [
        Validators.required,
      ]),
      accountType: new FormControl({ value: '', disabled: true }, [
        Validators.required,
      ]),
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
      phone: new FormControl(''),
    }),
    countrySelectFormGroup(),
  );

  constructor() {
    this.api.getMyRoles().subscribe((roles) => {
      const isAdmin = roles.some((role) => role.roleId === ADMIN_ROLE_ID);
      this.isAdmin.set(isAdmin);

      const nameControls = ['firstName', 'lastName'];
      nameControls.forEach((name) => {
        const control = this.form.get(name);
        if (isAdmin) {
          control?.enable();
        } else {
          control?.disable();
        }
      });
    });

    effect(() => {
      const value = this.state.value();
      console.log('Profile data changed, updating form', value);
      if (!value.id || this.state.loading()) return;

      if (value.digitalAddress) {
        this.noOfficialAddress.set(true);
      }

      if (value.address) {
        try {
          const addressData = JSON.parse(value.address);
          this.form.patchValue({ address: addressData });
        } catch (_e) {
          // Fallback if not JSON
        }
      }

      // Parse phone if present
      if (value.phone) {
        const supportedPrefixes = [
          '+55',
          '+1',
          '+351',
          '+44',
          '+34',
          '+33',
          '+49',
          '+39',
        ];
        const prefix =
          supportedPrefixes.find((p) => value.phone!.startsWith(p)) || '+55';
        let number = value.phone.substring(prefix.length);

        // Apply mask if +55
        if (prefix === '+55') {
          if (number.length > 10) {
            number = `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`;
          } else if (number.length > 2) {
            number = `(${number.substring(0, 2)}) ${number.substring(2)}`;
          }
        }

        this.form.patchValue({
          phoneCountry: prefix,
          phone: number,
        });
      }

      this.form.patchValue({
        firstName: value.firstName,
        lastName: value.lastName,
        birthDate: this.toDateInputValue(value.birthDate),
        socialName: value.socialName,
        cpf: value.cpf,
        accountType: value.accountType,
        digitalAddress: value.digitalAddress,
        country: value.country, // Assuming countrySelectFormGroup adds 'country' control
      });
    });
  }

  private toDateInputValue(value?: string): string {
    if (!value) return '';

    const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) return isoDate[0];

    const brazilianDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!brazilianDate) return '';

    const [, day, month, year] = brazilianDate;
    return `${year}-${month}-${day}`;
  }

  submit() {
    if (this.form.invalid) return;

    const rawValue = this.form.getRawValue();

    // Combine phone
    let phone: string | null = null;
    if (rawValue.phone) {
      const cleanPhone = rawValue.phone.replace(/\D/g, '');
      phone = rawValue.phoneCountry + cleanPhone;
    }

    delete rawValue.cpf;
    delete rawValue.birthDate;
    if (!this.isAdmin()) {
      delete rawValue.firstName;
      delete rawValue.lastName;
    }

    const payload = {
      ...rawValue,
      phone,
      address: JSON.stringify({
        ...rawValue.address,
        ...(this.noOfficialAddress()
          ? { cep: null, street: null, number: null }
          : {}),
      }),
      digitalAddress: this.noOfficialAddress() ? rawValue.digitalAddress : null,
    };

    // Remove phoneCountry as it's not in DTO? DTO has index signature?
    // IProfileData has phone, country.
    // We should delete phoneCountry from payload if API doesn't like it.
    delete (payload as any).phoneCountry;

    this.api.patchMe(payload as any).subscribe(() => this.state.refresh());
  }
}
