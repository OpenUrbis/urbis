import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthState } from '../auth/auth.state';
import { IOrganization } from '../../shared/dto/organization.dto';

@Injectable({ providedIn: 'root' })
export class OrganizationState {
  private auth = inject(AuthState);
  private http = inject(HttpClient);

  private myOrganizations = rxResource({
    params: () => ({ isAuthenticated: this.auth.isAuthenticated() }),
    stream: ({ params }) => {
      if (!params.isAuthenticated) return of([]);
      return this.http.get<IOrganization[]>(
        `${environment.api}/organization/my`,
      );
    },
    defaultValue: [],
  });

  loading = computed(() => this.myOrganizations.isLoading());
  value = computed(() => ({
    myOrganizations: this.myOrganizations.value(),
    selectedOrganization: this.myOrganizations.value()[0],
  }));
  errors = computed(() => this.myOrganizations.error());

  refresh() {
    this.myOrganizations.reload();
  }
}
