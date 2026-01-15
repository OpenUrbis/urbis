import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileState } from '../../../states/profile/profile.state';
import { ProfileEditApi } from '../services/profile-edit-api';
import { passwordFormGroup, PasswordFormGroup, HlmInputDirective, HlmLabelDirective, HlmButtonDirective } from '../../../../../projects/shared/src/public-api';
import { mergeFormGroups } from '../../../shared/utils/merge-form-groups';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-change-password-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PasswordFormGroup,
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective
  ],
  templateUrl: './change-password-form.html',
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
