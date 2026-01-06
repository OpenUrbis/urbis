import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { AuthState } from '../auth/auth.state';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IUser } from '../../pages/users/dto/user.dto';

@Injectable({ providedIn: 'root' })
export class ProfileState {
  private http = inject(HttpClient);
  private auth = inject(AuthState);

  private profileResource = rxResource({
    params: () => ({ isAuthenticated: this.auth.isAuthenticated() }),
    stream: ({ params }) => {
      if (!params.isAuthenticated) return of({} as IUser);
      return this.http.get<IUser>(`${environment.api}/auth/me`);
    },
    defaultValue: {} as IUser,
  });

  loading = computed(
    () => this.profileResource.isLoading() || !this.profileResource.value(),
  );
  value = computed(() => this.profileResource.value());
  errors = computed(() => this.profileResource.error());

  refresh() {
    this.profileResource.reload();
  }
}
