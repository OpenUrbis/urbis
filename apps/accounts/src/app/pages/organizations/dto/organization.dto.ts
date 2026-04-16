import { IUserAssigmentResponse } from '../../../components/role-manager/dto/user-assignment.dto';

export interface IOrganization {
  id: string;
  name: string;
  description?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface IResponseOrganizationWithRole extends IOrganization {
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
