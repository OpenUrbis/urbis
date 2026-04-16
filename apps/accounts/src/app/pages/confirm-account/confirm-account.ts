import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmAccountApi } from './services/confirm-account';

@Component({
  selector: 'app-confirm-account',
  imports: [MatCardModule, MatButtonModule, RouterModule, TranslateModule],
  templateUrl: './confirm-account.html',
  styleUrl: './confirm-account.scss',
})
export class ConfirmAccount {
  error = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);

  confirmAccountApi = inject(ConfirmAccountApi);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  translate = inject(TranslateService);

  params = toSignal<{ hash: string }>(this.activatedRoute.params as any);

  constructor() {
    effect(() => {
      const hash = this.params()?.['hash'];
      if (hash) {
        this.loading.set(true);
        this.confirmAccountApi.confirmEmail(hash).subscribe({
          next: () => {
            this.router.navigate(['/']);
            this.loading.set(false);
            this.error.set(undefined);
          },
          error: (err) => {
            console.error(err);
            this.loading.set(false);
            this.error.set(
              this.translate.instant('pages.confirmAccount.errors.confirm'),
            );
          },
        });
      } else {
        this.error.set(
          this.translate.instant('pages.confirmAccount.errors.hashNotFound'),
        );
      }
    });
  }
}
