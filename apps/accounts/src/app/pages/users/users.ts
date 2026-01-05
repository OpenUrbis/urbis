import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { Subject, startWith, switchMap, tap } from 'rxjs';
import { LoadingContent } from '../../../../projects/shared/src/public-api';
import { IPagination } from '../../shared/dto/pagination.dto';
import { UsersApi } from './services/users-api';

@Component({
  selector: 'app-users',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterLink,
    LoadingContent,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  pagination$ = new Subject<IPagination>();
  loading = signal<boolean>(false);

  usersApi = inject(UsersApi);

  users = toSignal(
    // TO DO: Paginação dos users
    this.pagination$.pipe(
      startWith({ page: 0, limit: 10 }),
      tap(() => this.loading.set(true)),
      switchMap((pagination) => this.usersApi.list()),
      tap(() => this.loading.set(false)),
    ),
  );
}
