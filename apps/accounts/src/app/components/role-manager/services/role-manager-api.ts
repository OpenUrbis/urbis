import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  IPaginationResponse,
  IPaginationWithExclude,
} from '../../../shared/dto/pagination.dto';
import { IAssignRoleUserRequest } from '../dto/assign-role-user.dto';
import { IPermissionResponse } from '../dto/permission.dto';
import {
  ICreateRoleRequest,
  IRoleResponse,
  IUpdateRoleRequest,
} from '../dto/role.dto';
import { IUserAssigmentResponse } from '../dto/user-assignment.dto';

const API_BASE = `${environment.api}/role`;

@Injectable({
  providedIn: 'root',
})
export class RoleManagerApi {
  httpClient = inject(HttpClient);
  matSnackBar = inject(MatSnackBar);

  create(data: ICreateRoleRequest) {
    return this.httpClient.post(`${API_BASE}`, data);
  }

  update(id: string, data: IUpdateRoleRequest) {
    return this.httpClient.put(`${API_BASE}/${id}`, data);
  }

  getUserRoles(userId: string) {
    return this.httpClient.get<IUserAssigmentResponse[]>(
      `${API_BASE}/user/${userId}`,
    );
  }

  listPermissions(params?: IPaginationWithExclude) {
    return this.httpClient
      .get<IPermissionResponse[]>(`${API_BASE}/permission/list`, {
        params: params
          ? new HttpParams({ fromObject: params as any })
          : undefined,
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.matSnackBar.open(
            'Houve um erro ao carregar as permissões do sistema',
          );

          return of([]);
        }),
      );
  }

  listRoles(params?: IPaginationWithExclude) {
    return this.httpClient
      .get<IPaginationResponse<IRoleResponse>>(`${API_BASE}/list`, {
        params: params
          ? new HttpParams({ fromObject: params as any })
          : undefined,
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.matSnackBar.open(
            'Houve um erro ao carregar os cargos do sistema',
          );

          return of([]);
        }),
      );
  }

  updateAssignByOrganization(
    organizationId: string,
    data: { roleIds: string[]; userId: string },
  ) {
    return this.httpClient.put<IUserAssigmentResponse>(
      `${API_BASE}/assign/${organizationId}`,
      data,
    );
  }

  createAssignByOrganization(
    organizationId: string,
    data: { roleIds: string[]; userId: string },
  ) {
    return this.httpClient.post<IUserAssigmentResponse>(
      `${API_BASE}/assign/${organizationId}`,
      data,
    );
  }

  assign(data: IAssignRoleUserRequest) {
    return this.httpClient.patch<IUserAssigmentResponse>(
      `${API_BASE}/assign`,
      data,
    );
  }

  unassign(id: string) {
    return this.httpClient.patch(`${API_BASE}/unassign/${id}`, {});
  }
}
