import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  countrySelectFormGroup,
  LoadingButton,
  LoadingContent,
  phoneFormGroup,
} from '../../../../projects/shared/src/public-api';
import { mergeFormGroups } from '../../shared/utils/merge-form-groups';
import { ProfileState } from '../../states/profile/profile.state';
import { UsersApi } from '../users/services/users-api';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { ProfileAvatarComponent } from '../../components/profile-avatar/profile-avatar';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    LoadingContent,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    LoadingButton,
    RouterModule,
    TranslateModule,
    ProfileAvatarComponent,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  loadingResend = signal<boolean>(false);

  form = mergeFormGroups(
    new FormGroup({
      firstName: new FormControl({ value: '', disabled: true }),
      lastName: new FormControl({ value: '', disabled: true }),
      email: new FormControl({ value: '', disabled: true }),
    }),
    phoneFormGroup({ disabled: true, required: false }),
    countrySelectFormGroup({ disabled: true, required: false }),
  );

  firstName = computed(() => this.profileState.value().firstName);
  lastName = computed(() => this.profileState.value().lastName);
  fullName = computed(() =>
    !this.lastName()
      ? this.firstName()
      : `${this.firstName()} ${this.lastName()}`,
  );
  email = computed(() => this.profileState.value().email);
  isEmailConfirmed = computed(() => this.profileState.value().isEmailConfirmed);
  country = computed(() => this.profileState.value().country);
  createdAt = computed(() => this.profileState.value().createdAt);
  updatedAt = computed(() => this.profileState.value().updatedAt);
  status = computed(() => this.profileState.value().status);

  profileState = inject(ProfileState);
  userApi = inject(UsersApi);
  matSnackBar = inject(MatSnackBar);
  translate = inject(TranslateService);

  constructor() {
    this.profileState.refresh();
    effect(() => {
      if (!this.profileState.value().id || this.profileState.loading()) return;

      this.form.patchValue({
        email: this.profileState.value().email,
        firstName: this.profileState.value().firstName,
        lastName: this.profileState.value().lastName,
        phone: this.profileState.value().phone,
        country: this.profileState.value().country,
      });
    });
  }

  async resendEmailConfirmation() {
    this.loadingResend.set(true);

    try {
      await firstValueFrom(this.userApi.resendEmailConfirmation());
    } catch (err) {
      console.error(err);
      this.matSnackBar.open(
        this.translate.instant('pages.profile.email.resendError'),
      );
    } finally {
      this.loadingResend.set(false);
    }
  }
}
