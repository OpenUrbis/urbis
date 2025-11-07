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
import { LoadingButton } from '../../../../../../../projects/shared/src/public-api';
import { SignInApi } from '../../../services/sign-in-api';

@Component({
  selector: 'app-two-factor-verify',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    CommonModule,
    LoadingButton,
  ],
  templateUrl: './two-factor-verify.html',
  styleUrl: './two-factor-verify.scss',
})
export class TwoFactorVerify {
  form = new FormGroup({});
  otp = new FormControl('', [Validators.required, Validators.minLength(6)]);
  loading = signal<boolean>(false);

  accessToken = input.required<string>();
  verified = output<boolean>();

  signInApi = inject(SignInApi);
  matSnackBar = inject(MatSnackBar);

  async send(): Promise<any> {
    if (this.otp.invalid) return this.matSnackBar.open('O código é inválido');

    this.loading.set(true);
    try {
      const { redirectToCallback } = await firstValueFrom(
        this.signInApi.verify2fa(this.otp.value!, this.accessToken()),
      );

      location.href = redirectToCallback;
    } catch (err: any) {
      console.error(err);
      const isInvalid = err?.error?.message === 'Invalid code';
      this.matSnackBar.open(
        isInvalid
          ? 'O código informado é inválido'
          : 'Houve um erro ao validar o código',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
