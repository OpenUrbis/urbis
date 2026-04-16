import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { ForgotServiceApi } from './services/forgot-password-api';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { _, TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class ForgotPassword {
  private readonly api = inject(ForgotServiceApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  protected submit() {
    if (this.form.invalid) return;
    this.api
      .sendEmail(this.form.controls.email.value)
      .pipe(
        catchError((error) => {
          console.error(error);
          this.matSnackBar.open(
            this.translate.instant('pages.forgotPassword.errors.sendEmail'),
          );
          return EMPTY;
        }),
      )
      .subscribe(() =>
        this.router.navigate(['sent'], { relativeTo: this.route }),
      );
  }
}
