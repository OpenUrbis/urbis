import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

import { IOrganization } from '../../pages/organizations/dto/organization.dto';
import { AuthState } from '../auth/auth.state';

const ORGANIZATION_LOCAL_STORAGE_KEY = 'organization-seleted';

@Injectable({ providedIn: 'root' })
export class OrganizationState {
  private _selectedOrganization = signal<IOrganization | null>(null);

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

  selectedOrganization = computed(() => this._selectedOrganization());
  loading = computed(
    () => this.myOrganizations.isLoading() || !this.myOrganizations.value(),
  );
  value = computed(() => ({
    myOrganizations: this.myOrganizations.value(),
  }));
  errors = computed(() => this.myOrganizations.error());

  constructor() {
    this.updateSelectedOrganization();

    effect(() => {
      // Guard against running default selection/clear logic while organizations are still loading
      if (this.myOrganizations.isLoading()) {
        return;
      }

      const orgs = this.myOrganizations.value();
      const selected = this._selectedOrganization();

      if (orgs && orgs.length > 0) {
        if (!selected || !orgs.find((o) => o.id === selected.id)) {
          this.selectOrganization(orgs[0]);
        }
      } else if (orgs && orgs.length === 0 && selected) {
        this.clearSelectedOrganization();
        this._selectedOrganization.set(null);
      }
    });
  }

  refresh() {
    this.myOrganizations.reload();
  }

  updateSelectedOrganization(silent: boolean = false): IOrganization | null {
    const org = localStorage.getItem(ORGANIZATION_LOCAL_STORAGE_KEY);
    let organization: IOrganization | null = null;

    try {
      organization = JSON.parse(org!);
    } catch (_err) {
      organization = null;
    }

    if (!silent) this._selectedOrganization.set(organization);
    else this._selectedOrganization.update(() => organization);
    return organization;
  }

  selectOrganization(org: IOrganization) {
    localStorage.setItem(ORGANIZATION_LOCAL_STORAGE_KEY, JSON.stringify(org));

    this.updateSelectedOrganization();
  }

  clearSelectedOrganization() {
    localStorage.removeItem(ORGANIZATION_LOCAL_STORAGE_KEY);
  }
}
