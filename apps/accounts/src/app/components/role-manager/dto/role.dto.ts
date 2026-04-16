import { IPermissionResponse } from './permission.dto';

export type ScopeType = 'global' | 'any' | 'own';

export interface IInternalPermission extends IPermissionResponse {
  scope: ScopeType;
}

export interface IRoleResponse {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  roleId?: string;
  rolePermissions: IRolePermission[];
  permissions?: IInternalPermission[];
}

export interface IRolePermission {
  id: string;
  scope: ScopeType;
  permission: IPermissionResponse;
}

export interface ICreateRoleRequest {
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface IUpdateRoleRequest {
  name?: string;
  description?: string | null;
  permissions?: string[];
}
