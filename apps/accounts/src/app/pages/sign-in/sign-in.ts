import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { SignInApi } from './services/sign-in-api';

@Component({
  selector: 'app-sign-in',
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],
  providers: [HttpClient, SignInApi],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn implements OnInit {
  formGroup = new FormGroup({
    email: new FormControl('test@test.com', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('Teste@1234', [Validators.required]),
  });

  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  signInService = inject(SignInApi);

  ngOnInit() {
    this.validateSession();
    if (localStorage.getItem('redirect-to-sign-up')) {
      localStorage.removeItem('redirect-to-sign-up');
      this.router.navigate(['sign-up']);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const pastedText = event.clipboardData?.getData('text/plain');

    if (pastedText) {
      this.formGroup.controls.email.setValue(pastedText.replace(/\s/g, ''));
    }
  }

  validateSession() {
    this.activatedRoute.queryParams.subscribe(({ clientId, session }) => {
      if (clientId !== undefined && session !== undefined) {
        this.signInService.storeSession(clientId, session);
      }
      if (this.signInService.haveStoredSession()) {
        this.signInService.trySession().subscribe({
          error: () => {
            this.router.navigate(['/']);
          },
        });
        return;
      }
      this.router.navigate(['/']);
    });
  }

  onSubmit() {
    this.formGroup.controls.email.setValue(
      this.formGroup.controls.email.value?.replace(/\s/g, '') ?? '',
      { emitEvent: false },
    );
    this.signInService.authenticate(this.formGroup.value).subscribe({
      error: ({ error }) => {
        console.error(error);
      },
      next: ({
        redirectToCallback,
        otpValidated,
        requires2fa,
        accessToken,
      }: any) => {
        if (!requires2fa && redirectToCallback)
          return (location.href = redirectToCallback);

        this.router.navigate(['/two-factor'], {
          queryParams: { otpValidated, requires2fa, accessToken },
        });
      },
    });
  }
}
