import { Component, inject, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { TwoFactoryApi } from '../../services/two-factory-api';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { LoadingButton } from '../../../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-two-factory-verify',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    CommonModule,
    LoadingButton
  ],
  templateUrl: './two-factory-verify.html',
  styleUrl: './two-factory-verify.scss',
})
export class TwoFactoryVerify {
  form = new FormGroup({});
  otp = new FormControl('', [Validators.required, Validators.minLength(6)]);
  loading = signal<boolean>(false);

  verified = output<boolean>();

  twoFactoryApi = inject(TwoFactoryApi);
  matSnackBar = inject(MatSnackBar);

  async send(): Promise<any> {
    if (this.otp.invalid) return this.matSnackBar.open('O código é inválido');

    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.twoFactoryApi.verify2fa(this.otp.value!),
      );
      console.log(response);
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
