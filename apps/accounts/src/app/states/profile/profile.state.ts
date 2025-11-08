import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { AuthState } from '../auth/auth.state';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TUser } from '../../shared/types/user';

@Injectable({ providedIn: 'root' })
export class ProfileState {
  private http = inject(HttpClient);
  private auth = inject(AuthState);

  private profileResource = rxResource({
    params: () => ({ isAuthenticated: this.auth.isAuthenticated() }),
    stream: ({ params }) => {
      if (!params.isAuthenticated) return of({} as TUser);
      return this.http.get<TUser>(`${environment.api}/auth/me`);
    },
    defaultValue: {} as TUser,
  });

  loading = computed(() => this.profileResource.isLoading());
  value = computed(() => this.profileResource.value());
  errors = computed(() => this.profileResource.error());

  refresh() {
    this.profileResource.reload();
  }
}
