import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'lib-callback',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    RouterModule,
  ],
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback implements OnInit {
  errorMessage: any;
  loading = true;

  oidcSecurityService = inject(OidcSecurityService);

  ngOnInit(): void {
    this.oidcSecurityService.checkAuth().subscribe({
      next: ({ isAuthenticated, userData, errorMessage }) => {
        if (isAuthenticated) {
          return;
        }
        if (userData === null) {
          this.loading = false;
          this.errorMessage = 'We were unable to retrieve your username';
        }
        if (errorMessage) {
          this.loading = false;
          this.errorMessage = errorMessage;
        }
      },
      error: (e) => {
        console.log('e', e);
        this.errorMessage = e.message ?? 'You have invalid callback session';
      },
    });
  }
}
