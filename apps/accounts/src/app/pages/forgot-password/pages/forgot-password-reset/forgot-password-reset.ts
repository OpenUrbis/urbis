import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  passwordFormGroup,
  PasswordFormGroup,
} from '../../../../../../projects/shared/src/public-api';
import { ForgotServiceApi } from '../../services/forgot-password-api';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password-reset.html',
  styleUrl: './forgot-password-reset.scss',
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    PasswordFormGroup,
    TranslateModule,
  ],
})
export class ForgotPasswordReset {
  private readonly api = inject(ForgotServiceApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly form = passwordFormGroup();

  submit() {
    const hash = this.route.snapshot.paramMap.get('hash');
    if (this.form.invalid || !hash) return;
    this.api
      .resetPassword(this.form.controls.password.value, hash)
      .pipe(
        catchError((error) => {
          console.error(error);
          this.matSnackBar.open(
            this.translate.instant(
              'pages.forgotPassword.errors.submitNewPassword',
            ),
          );
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.router.navigate(['/sign-in']);
      });
  }
}
