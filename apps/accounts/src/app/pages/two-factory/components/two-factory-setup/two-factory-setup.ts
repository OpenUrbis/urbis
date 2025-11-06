import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
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
import { TwoFactoryApi } from '../../services/two-factory-api';
import { TwoFactoryVerify } from '../two-factory-verify/two-factory-verify';

@Component({
  selector: 'app-two-factory-setup',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule,
    LoadingContent,
    LoadingButton,
    TwoFactoryVerify,
  ],
  templateUrl: './two-factory-setup.html',
  styleUrl: './two-factory-setup.scss',
})
export class TwoFactorySetup {
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

  twoFactoryApi = inject(TwoFactoryApi);
  matSnackBar = inject(MatSnackBar);

  constructor() {
    this.sendCode();

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
      const response = await firstValueFrom(
        this.twoFactoryApi.resendEmailOtp(),
      );
      console.log(response);

      this.resendCount.set(60);
    } catch (err) {
      console.error(err);
      this.matSnackBar.open('Houve um erro ao reenviar o código');
    } finally {
      this.contentLoading.set(false);
      this.resendLoading.set(false);
    }
  }

  async setup(): Promise<any> {
    if (this.emailOtp.invalid)
      return this.matSnackBar.open('O código digitado é inválido');
    this.loading.set(true);

    try {
      const response = await firstValueFrom(
        this.twoFactoryApi.setup2fa(this.emailOtp.value!),
      );
      this.qrcode.set(response.qrCode);

      this.nextStep();
    } catch (err: any) {
      console.error(err);
      const isInvalid = err?.error?.isInvalid;
      this.matSnackBar.open(
        isInvalid
          ? 'O código informado é inválido'
          : 'Houve um erro ao validar o código',
      );
    } finally {
      this.loading.set(false);
    }
  }

  nextStep() {
    this.step.set(this.step() + 1);
  }
}
