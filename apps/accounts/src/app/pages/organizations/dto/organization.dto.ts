import { IRoleResponse } from '../../../components/role-manager/dto/role.dto';
import { IUserAssigmentResponse } from '../../../components/role-manager/dto/user-assignment.dto';

export interface IResponseOrganization {
  id: string;
  name: string;
  description?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface IResponseOrganizationWithRole extends IResponseOrganization {
  userRoleAssignments: IUserAssigmentResponse[];
}

export interface IRequestCreateOrganization {
  name: string;
  description?: string;
}

export interface IRequestUpdateOrganization {
  name?: string;
  description?: string;
}
