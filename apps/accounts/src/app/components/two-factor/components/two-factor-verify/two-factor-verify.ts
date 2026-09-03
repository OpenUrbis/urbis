import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  HlmInputDirective,
  HlmLabelDirective,
  LoadingButton,
} from '../../../../../../projects/shared/src/public-api';
import { HlmToasterService } from '../../../../../../projects/shared/src/public-api';
import { firstValueFrom } from 'rxjs';
import { SignInApi } from '../../../../pages/sign-in/services/sign-in-api';
import { TwoFactorApi } from '../../services/two-factor-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-two-factor-verify',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmInputDirective,
    HlmLabelDirective,
    LoadingButton,
    TranslateModule,
  ],
  templateUrl: './two-factor-verify.html',
})
export class TwoFactorVerify {
  form = new FormGroup({});
  otp = new FormControl('', [Validators.required, Validators.minLength(6)]);
  loading = signal<boolean>(false);

  accessToken = input.required<string>();
  useOidcFlow = input<boolean>(true);
  verified = output<boolean>();
  code = output<string>();

  signInApi = inject(SignInApi);
  twoFactorApi = inject(TwoFactorApi);
  toaster = inject(HlmToasterService);
  translate = inject(TranslateService);

  async send(): Promise<any> {
    if (this.otp.invalid)
      return this.toaster.error(
        this.translate.instant('components.twoFactorVerify.errors.invalid'),
      );

    this.loading.set(true);
    try {
      if (this.useOidcFlow()) {
        const { redirectToCallback } = await firstValueFrom(
          this.signInApi.verify2fa(this.otp.value!, this.accessToken()),
        );

        location.href = redirectToCallback;
      } else {
        const { isValid } = await firstValueFrom(
          this.twoFactorApi.verify(this.otp.value!, this.accessToken()),
        );

        this.verified.emit(isValid);
        if (isValid) this.code.emit(this.otp.value!);
      }
    } catch (err: any) {
      console.error(err);
      const isInvalid = err?.error?.message === 'Invalid code';
      this.toaster.error(
        isInvalid
          ? this.translate.instant(
              'components.twoFactorVerify.errors.invalidProvided',
            )
          : this.translate.instant(
              'components.twoFactorVerify.errors.validate',
            ),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
