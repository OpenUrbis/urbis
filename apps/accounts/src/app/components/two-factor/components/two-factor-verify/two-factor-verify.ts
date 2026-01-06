import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { LoadingButton } from '../../../../../../projects/shared/src/public-api';
import { SignInApi } from '../../../../pages/sign-in/services/sign-in-api';
import { TwoFactorApi } from '../../services/two-factor-api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-two-factor-verify',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    CommonModule,
    LoadingButton,
    TranslateModule,
  ],
  templateUrl: './two-factor-verify.html',
  styleUrl: './two-factor-verify.scss',
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
  matSnackBar = inject(MatSnackBar);
  translate = inject(TranslateService);

  async send(): Promise<any> {
    if (this.otp.invalid)
      return this.matSnackBar.open(
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
      this.matSnackBar.open(
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
