import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  countrySelectFormGroup,
  LoadingButton,
  LoadingContent,
  phoneFormGroup,
  HlmToasterService,
  HlmCardDirective,
  HlmCardContentDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import {
  lucidePencil,
  lucideUser,
  lucideMail,
  lucideGlobe,
  lucideCheck,
  lucideCalendar,
  lucideLogIn,
  lucideKey,
} from '@ng-icons/lucide';
import { mergeFormGroups } from '../../shared/utils/merge-form-groups';
import { ProfileState } from '../../states/profile/profile.state';
import { UsersApi } from '../users/services/users-api';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { ProfileAvatarComponent } from '../../components/profile-avatar/profile-avatar';
import { lucideActivity } from '@ng-icons/lucide';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmIconComponent,
    LoadingContent,
    LoadingButton,
    RouterModule,
    TranslateModule,
    ProfileAvatarComponent,
  ],
  providers: [
    provideIcons({
      lucidePencil,
      lucideUser,
      lucideMail,
      lucideGlobe,
      lucideCheck,
      lucideCalendar,
      lucideLogIn,
      lucideActivity,
      lucideKey,
    }),
  ],
  templateUrl: './profile.html',
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

  cpf = computed(() => this.profileState.value().cpf);
  govBrData = computed(() => this.profileState.value().govBrData);
  lastGovBrLoginAt = computed(() => this.profileState.value().lastGovBrLoginAt);
  govBrFirstLoginAt = computed(
    () => this.profileState.value().govBrFirstLoginAt,
  );

  profileState = inject(ProfileState);
  userApi = inject(UsersApi);
  toaster = inject(HlmToasterService);
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
      this.toaster.success(
        this.translate.instant('pages.profile.email.resendSuccess'),
      );
    } catch (err) {
      console.error(err);
      this.toaster.error(
        this.translate.instant('pages.profile.email.resendError'),
      );
    } finally {
      this.loadingResend.set(false);
    }
  }
}
