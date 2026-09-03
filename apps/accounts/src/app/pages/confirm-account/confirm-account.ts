import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '../../../../projects/shared/src/public-api';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmAccountApi } from './services/confirm-account';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './confirm-account.html',
})
export class ConfirmAccount {
  error = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);

  confirmAccountApi = inject(ConfirmAccountApi);
  activatedRoute = inject(ActivatedRoute);

  translate = inject(TranslateService);

  params = toSignal<{ hash: string }>(this.activatedRoute.params as any);

  constructor() {
    effect(() => {
      const hash = this.params()?.['hash'];
      if (hash) {
        this.loading.set(true);
        this.confirmAccountApi.confirmEmail(hash).subscribe({
          next: () => {
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
