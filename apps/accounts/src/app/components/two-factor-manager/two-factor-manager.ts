import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { LoadingContent, HlmButtonDirective, HlmIconComponent, HlmToasterService } from '../../../../projects/shared/src/public-api';
import { IUser } from '../../pages/users/dto/user.dto';
import { ProfileState } from '../../states/profile/profile.state';
import { TwoFactorVerify } from '../two-factor/components/two-factor-verify/two-factor-verify';
import { TwoFactorApi } from '../two-factor/services/two-factor-api';
import { TwoFactor } from '../two-factor/two-factor';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideIcons } from '@ng-icons/core';
import { lucideLock, lucideUnlock } from '@ng-icons/lucide';

@Component({
  selector: 'app-two-factor-manager',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmButtonDirective,
    HlmIconComponent,
    TwoFactorVerify,
    TwoFactor,
    LoadingContent,
    TranslateModule,
  ],
  providers: [provideIcons({ lucideLock, lucideUnlock })],
  templateUrl: './two-factor-manager.html',
})
export class TwoFactorManager {
  loading = signal<boolean>(false);
  accessToken = signal<string | undefined>(undefined);
  user = input.required<IUser>();

  /** Visual step
   *  0: Checker view
   *  1: Active form
   *  2: Desactive form
   */
  step = signal<number>(0);

  isActive = computed(() => this.user().otpSecret && this.user().otpValidated);

  oidcSecurityService = inject(OidcSecurityService);
  profileState = inject(ProfileState);
  twoFactorApi = inject(TwoFactorApi);
  toaster = inject(HlmToasterService);
  translate = inject(TranslateService);

  constructor() {
    effect(() => {
      this.oidcSecurityService
        .checkAuth()
        .subscribe(({ isAuthenticated, accessToken }) => {
          if (isAuthenticated) {
            this.accessToken.set(accessToken);
          }
        });
    });
  }

  validated(value: boolean) {
    if (!value) return;

    this.profileState.refresh();
    this.step.set(0);
  }

  async desactive(value: string) {
    this.loading.set(true);

    try {
      await firstValueFrom(
        this.twoFactorApi.desactive(value, this.accessToken()!),
      );

      this.profileState.refresh();
      this.step.set(0);
    } catch (err) {
      this.toaster.error(
        this.translate.instant(
          'components.twoFactorManager.errors.disable',
        ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
