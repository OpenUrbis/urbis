import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  HlmButtonDirective,
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  passwordFormGroup,
  PasswordFormGroup,
  LogoComponent,
} from '../../../../../../projects/shared/src/public-api';
import { ForgotServiceApi } from '../../services/forgot-password-api';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HlmToasterService } from '../../../../../../projects/shared/src/public-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardFooterDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmButtonDirective,
    ReactiveFormsModule,
    PasswordFormGroup,
    TranslateModule,
    LogoComponent,

  ],
  templateUrl: './forgot-password-reset.html',
})
export class ForgotPasswordReset {
  private readonly api = inject(ForgotServiceApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toaster = inject(HlmToasterService);
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
          this.toaster.error(
            this.translate.instant(
              'pages.forgotPassword.errors.submitNewPassword'
            )
          );
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.router.navigate(['/sign-in']);
      });
  }
}
