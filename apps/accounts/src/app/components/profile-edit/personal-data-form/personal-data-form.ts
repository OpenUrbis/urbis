import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileState } from '../../../states/profile/profile.state';
import { ProfileEditApi } from '../services/profile-edit-api';
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
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-personal-data-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PhoneFormGroup,
    CountrySelectFormGroup,
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective
  ],
  templateUrl: './personal-data-form.html',
})
export class PersonalDataForm {
  api = inject(ProfileEditApi);
  state = inject(ProfileState);

  form = mergeFormGroups(
    new FormGroup({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
    }),
    phoneFormGroup(),
    countrySelectFormGroup(),
  );

  constructor() {
    effect(() => {
      const value = this.state.value();
      if (!value.id || this.state.loading()) return;

      this.form.patchValue({
        ...value,
      });
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.api.patchMe(this.form.value).subscribe(() => this.state.refresh());
  }
}
