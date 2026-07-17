
export interface IPermissionResponse {
  id: string;
  action: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isSystemRole: boolean;
}
