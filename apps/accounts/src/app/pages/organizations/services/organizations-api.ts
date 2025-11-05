import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  IRequestCreateOrganization,
  IRequestUpdateOrganization,
  IResponseOrganization,
} from '../dto/organization.dto';

const API_BASE = `${environment.api}/organization`;

@Injectable({
  providedIn: 'root',
})
export class OrganizationsApi {
  httpClient = inject(HttpClient);

  list() {
    return this.httpClient.get<IResponseOrganization[]>(`${API_BASE}`);
  }

  get(id: string) {
    return this.httpClient.get<IResponseOrganization>(`${API_BASE}/${id}`);
  }

  create(data: IRequestCreateOrganization) {
    return this.httpClient.post<IResponseOrganization>(`${API_BASE}`, data);
  }

  update(id: string, data: IRequestUpdateOrganization) {
    return this.httpClient.put<IResponseOrganization>(
      `${API_BASE}/${id}`,
      data,
    );
  }
}
