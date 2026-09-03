import { Component, inject } from '@angular/core';
import {
  HlmButtonDirective,
  HlmInputDirective,
  HlmLabelDirective,
  HlmIconComponent,
} from '../../../../projects/shared/src/public-api';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideLoader2 } from '@ng-icons/lucide';
import { ForgotServiceApi } from './services/forgot-password-api';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, EMPTY, finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HlmToasterService } from '../../../../projects/shared/src/public-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  providers: [provideIcons({ lucideArrowLeft, lucideLoader2 })],
  imports: [
    CommonModule,
    RouterModule,
    HlmInputDirective,
    HlmButtonDirective,
    HlmLabelDirective,
    HlmIconComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPassword {
  private readonly api = inject(ForgotServiceApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toaster = inject(HlmToasterService);
  private readonly translate = inject(TranslateService);

  protected loading = false;

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  protected submit() {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.api
      .sendEmail(this.form.controls.email.value)
      .pipe(
        catchError((error) => {
          console.error(error);
          this.toaster.error(
            this.translate.instant('pages.forgotPassword.errors.sendEmail'),
          );
          return EMPTY;
        }),
        finalize(() => (this.loading = false)),
      )
      .subscribe(() =>
        this.router.navigate(['sent'], { relativeTo: this.route }),
      );
  }
}
