export interface IAssignRoleUserRequest {
  userId: string;
  roleId: string;
  organizationId?: string;
}

export interface IAssignRoleUserResponse {
  id: string;
  userId: string;
  roleId: string;
  organizationId?: string;
  assignAt: string;
}
