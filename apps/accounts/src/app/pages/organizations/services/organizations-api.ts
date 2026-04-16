import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  IPaginationResponse,
  IPaginationWithExclude,
} from '../../../shared/dto/pagination.dto';
import {
  IRequestCreateOrganization,
  IRequestUpdateOrganization,
  IOrganization,
  IResponseOrganizationWithRole,
} from '../dto/organization.dto';

const API_BASE = `${environment.api}/organization`;

@Injectable({
  providedIn: 'root',
})
export class OrganizationsApi {
  httpClient = inject(HttpClient);
  matSnackBar = inject(MatSnackBar);

  list(params: IPaginationWithExclude = {}) {
    return this.httpClient
      .get<IPaginationResponse<IOrganization>>(`${API_BASE}`, {
        params: params
          ? new HttpParams({ fromObject: params as any })
          : undefined,
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.matSnackBar.open('Houve um erro ao carregar as organizações');

          return of([]);
        }),
      );
  }

  listByUser(userId: string) {
    return this.httpClient.get<IResponseOrganizationWithRole[]>(
      `${API_BASE}/user/${userId}`,
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
    return this.httpClient.put<IOrganization>(
      `${API_BASE}/${id}`,
      data,
    );
  }
}
