import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
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
import {
  LoadingButton,
  LoadingContent,
} from '../../../../../../projects/shared/src/public-api';
import { TwoFactorApi } from '../../services/two-factor-api';
import { TwoFactorVerify } from '../two-factor-verify/two-factor-verify';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-two-factor-setup',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule,
    LoadingContent,
    LoadingButton,
    TwoFactorVerify,
    TranslateModule,
  ],
  templateUrl: './two-factor-setup.html',
  styleUrl: './two-factor-setup.scss',
})
export class TwoFactorSetup {
  useOidcFlow = input<boolean>(true);
  accessToken = input.required<string>();
  verified = output<boolean>();

  form = new FormGroup({});
  emailOtp = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
  ]);
  contentLoading = signal<boolean>(false);
  resendLoading = signal<boolean>(false);
  loading = signal<boolean>(false);
  qrcode = signal<string | null>(null);

  resendCount = signal<number>(0);

  step = signal<number>(0);


  twoFactorApi = inject(TwoFactorApi);
  matSnackBar = inject(MatSnackBar);
  translate = inject(TranslateService);

  constructor() {
    effect(() => {
      if (!this.accessToken()) return;
      this.sendCode();
    });

    effect(() => {
      const count = this.resendCount();
      if (count !== 0) {
        setTimeout(() => {
          this.resendCount.set(count - 1);
        }, 1000);
      }
    });
  }

  async sendCode(resend?: boolean) {
    if (resend && this.resendCount() > 0) return;
    resend ? this.resendLoading.set(true) : this.contentLoading.set(true);

    try {
      await firstValueFrom(
        this.twoFactorApi.resendEmailOtp(this.accessToken()),
      );

      this.resendCount.set(60);
    } catch (err) {
      console.error(err);
      this.matSnackBar.open(
        this.translate.instant('components.twoFactorSetup.errors.resend'),
      );
    } finally {
      this.contentLoading.set(false);
      this.resendLoading.set(false);
    }
  }

  async setup(): Promise<any> {
    if (this.emailOtp.invalid)
      return this.matSnackBar.open(
        this.translate.instant(
          'components.twoFactorSetup.errors.emailOtpInvalid',
        ),
      );
    this.loading.set(true);

    try {
      const response = await firstValueFrom(
        this.twoFactorApi.setup2fa(this.emailOtp.value!, this.accessToken()),
      );
      this.qrcode.set(response.qrCode);

      this.nextStep();
    } catch (err: any) {
      console.error(err);
      const isInvalid = err?.error?.isInvalid;
      this.matSnackBar.open(
        isInvalid
          ? this.translate.instant(
              'components.twoFactorSetup.errors.invalidCode',
            )
          : this.translate.instant('components.twoFactorSetup.errors.validate'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  nextStep() {
    this.step.set(this.step() + 1);
  }
}
