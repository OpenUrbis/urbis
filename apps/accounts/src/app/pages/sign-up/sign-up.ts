import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaV3Module,
  ReCaptchaV3Service,
} from 'ng-recaptcha-2';
import { firstValueFrom } from 'rxjs';
import {
  countrySelectFormGroup,
  CountrySelectFormGroup,
  PasswordFormGroup,
  passwordFormGroup,
  phoneFormGroup,
  PhoneFormGroup,
} from '../../../../projects/shared/src/public-api';
import { environment } from '../../../environments/environment';
import { mergeFormGroups } from '../../shared/utils/merge-form-groups';
import { SignUpApi } from './services/sign-up-api';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  providers: [
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.googleRecaptchaSiteKey,
    },
  ],
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    PasswordFormGroup,
    CountrySelectFormGroup,
    PhoneFormGroup,
    TranslateModule,
    RecaptchaV3Module,
  ],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  loading = signal<boolean>(false);

  private api = inject(SignUpApi);
  private router = inject(Router);
  private recaptchaV3Service = inject(ReCaptchaV3Service);
  private matSnackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  formGroup = mergeFormGroups(
    new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      recaptcha: new FormControl('', []),
    }),
    passwordFormGroup(),
    countrySelectFormGroup(),
    phoneFormGroup(),
  );

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const pastedText = event.clipboardData?.getData('text/plain');

    if (pastedText) {
      this.formGroup.controls['email'].setValue(pastedText.replace(/\s/g, ''));
    }
  }

  resolveCaptcha(value: string | null) {
    if (!value) return;
    this.formGroup.get('recaptcha')?.setValue(value);
  }

  async submit() {
    if (this.formGroup.invalid) return;
    this.loading.set(true);
    try {
      this.resolveCaptcha(
        await firstValueFrom(this.recaptchaV3Service.execute('signup')),
      );

      await firstValueFrom(this.api.register(this.formGroup.value));
      this.router.navigate(['/sign-in']);
    } catch (err) {
      this.matSnackBar.open(
        this.translate.instant('pages.signUp.errors.submit'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
