import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HlmToasterService } from '../../../../../projects/shared/src/public-api';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IPaginationResponse } from '../../../shared/dto/pagination.dto';
import {
  IRequestCreateOrganization,
  IOrganization,
  IResponseOrganizationWithRole,
  IRequestUpdateOrganization,
} from '../dto/organization.dto';

const API_BASE = `${environment.api}/organization`;

@Injectable({
  providedIn: 'root',
})
export class OrganizationsApi {
  httpClient = inject(HttpClient);
  toaster = inject(HlmToasterService);

  list(filters?: any) {
    return this.httpClient
      .get<IPaginationResponse<IOrganization>>(`${API_BASE}`, {
        params: filters,
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.toaster.error('Houve um erro ao carregar as organizações');
          return of({ data: [], total: 0 } as IPaginationResponse<IOrganization>);
        }),
      );
  }

  get(id: string) {
    return this.httpClient.get<IOrganization>(`${API_BASE}/${id}`);
  }

  create(data: IRequestCreateOrganization) {
    return this.httpClient.post<IOrganization>(`${API_BASE}`, data);
  }

  createOwn(data: IRequestCreateOrganization) {
    return this.httpClient.post<IOrganization>(`${API_BASE}/own`, data);
  }

  update(id: string, data: IRequestUpdateOrganization) {
    return this.httpClient.put<IOrganization>(`${API_BASE}/${id}`, data);
  }

  delete(id: string) {
    return this.httpClient.delete(`${API_BASE}/${id}`);
  }

  listByUser(userId: string) {
    return this.httpClient.get<IResponseOrganizationWithRole[]>(
      `${API_BASE}/user/${userId}`,
    );
  }

  assignUser(organizationId: string, userId: string, roles: string[]) {
    return this.httpClient.post(`${API_BASE}/${organizationId}/user/${userId}`, {
      roles,
    });
  }
}
