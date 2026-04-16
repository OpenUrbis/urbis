import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG_ID } from '../auth.config';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-callback',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback implements OnInit {
  errorMessage: any;
  loading = true;

  oidcSecurityService = inject(OidcSecurityService);

  async ngOnInit() {
    try {
      const checkedAuths = await firstValueFrom(
        this.oidcSecurityService.checkAuthMultiple(),
      );

      checkedAuths.forEach(async (auth) => {
        const { isAuthenticated, userData, errorMessage, configId } = auth;

        if (configId !== AUTH_CONFIG_ID) return

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
      });
    } catch (err: any) {
      console.error(err);

      this.errorMessage = err.message ?? 'You have invalid callback session';
    }
  }
}
