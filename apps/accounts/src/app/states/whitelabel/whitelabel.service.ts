import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  IUnifiedWhitelabelApi,
  IUpdateWhitelabelDto,
  IWhitelabelApi,
} from './whitelabel.types';

@Injectable({ providedIn: 'root' })
export class WhitelabelApi {
  private readonly http = inject(HttpClient);

  getOrganizationWhitelabel(organizationId: string | undefined | null) {
    return this.http.get<IWhitelabelApi>(
      `${environment.api}/whitelabel/${organizationId}/accounts`,
    );
  }
  getUnifiedOrganizationWhitelabel(organizationId: string | undefined | null) {
    return this.http.get<IUnifiedWhitelabelApi>(
      `${environment.api}/whitelabel/${organizationId}/accounts/unified`,
    );
  }
  updateOrganizationWhitelabel(
    organizationId: string | undefined | null,
    payload: IUpdateWhitelabelDto,
  ) {
    return this.http.put<IUnifiedWhitelabelApi>(
      `${environment.api}/whitelabel/${organizationId}/accounts`,
      payload,
    );
  }
}
