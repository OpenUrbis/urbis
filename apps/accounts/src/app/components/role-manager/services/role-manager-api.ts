import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { IPagination } from '../../../shared/dto/pagination.dto';
import { IAssignRoleUserRequest } from '../dto/assign-role-user.dto';
import { IPermissionParams, IPermissionResponse } from '../dto/permission.dto';
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

  listPermissions(params?: IPermissionParams) {
    return this.httpClient.get<IPermissionResponse[]>(
      `${API_BASE}/permission/list`,
      {
        params: params
          ? new HttpParams({ fromObject: params as any })
          : undefined,
      },
    );
  }

  listRoles(params?: IPagination) {
    return this.httpClient.get<IRoleResponse[]>(`${API_BASE}/list`, {
      params: params
        ? new HttpParams({ fromObject: params as any })
        : undefined,
    });
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
