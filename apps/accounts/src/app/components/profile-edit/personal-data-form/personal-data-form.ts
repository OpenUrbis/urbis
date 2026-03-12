import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProfileState } from '../../../states/profile/profile.state';
import { ProfileEditApi } from '../services/profile-edit-api';

@Component({
  standalone: false,
  selector: 'app-personal-data-form',
  templateUrl: './personal-data-form.html',
  styleUrl: './personal-data-form.scss',
})
export class PersonalDataForm {
  api = inject(ProfileEditApi);
  state = inject(ProfileState);

  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
  });

  constructor() {
    effect(() => {
      if (!this.state.value().id || this.state.loading()) return;

      this.form.patchValue({
        firstName: this.state.value().firstName,
        lastName: this.state.value().lastName,
      });
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.api.patchMe(this.form.value).subscribe(() => this.state.refresh());
  }
}
