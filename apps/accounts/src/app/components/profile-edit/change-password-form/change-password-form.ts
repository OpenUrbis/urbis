import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProfileState } from '../../../states/profile/profile.state';
import { ProfileEditApi } from '../services/profile-edit-api';
import { passwordFormGroup } from '../../../../../projects/shared/src/public-api';
import { mergeFormGroups } from '../../../shared/utils/merge-form-groups';

@Component({
  standalone: false,
  selector: 'app-change-password-form',
  templateUrl: './change-password-form.html',
  styleUrl: './change-password-form.scss',
})
export class ChangePasswordForm {
  api = inject(ProfileEditApi);
  state = inject(ProfileState);

  form = mergeFormGroups(
    new FormGroup({
      oldPassword: new FormControl('', Validators.required),
    }),
    passwordFormGroup(),
  );

  submit() {
    if (this.form.invalid) return;
    this.api.patchMe(this.form.value).subscribe(() => this.state.refresh());
  }
}
