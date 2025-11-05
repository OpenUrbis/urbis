import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { Subject, startWith, switchMap, tap } from 'rxjs';
import { IPagination } from '../../shared/dto/pagination.dto';
import { OrganizationsApi } from './services/organizations-api';
import { LoadingContent } from '../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-organizations',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterLink,
    LoadingContent,
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.scss',
})
export class Organizations {
  pagination$ = new Subject<IPagination>();
  loading = signal<boolean>(false);

  organizationsApi = inject(OrganizationsApi);

  organizations = toSignal(
    // TO DO: Paginação dos organizations
    this.pagination$.pipe(
      startWith({ page: 0, limit: 10 }),
      tap(() => this.loading.set(true)),
      switchMap((pagination) => this.organizationsApi.list()),
      tap(() => this.loading.set(false)),
    ),
  );
}
