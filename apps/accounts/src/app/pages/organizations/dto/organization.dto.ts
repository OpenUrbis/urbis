import { IUserAssigmentResponse } from '../../../components/role-manager/dto/user-assignment.dto';

export interface IOrganization {
  id: string;
  name: string;
  document?: string;
  description?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  status?: 'active' | 'inactive';
  userCount?: number;
  registrationType?: string;
  representedType?: string;
}

export interface IOrganizationRepresentative {
  id: string;
  firstName?: string;
  lastName?: string;
}

export interface IResponseOrganizationWithRole extends IOrganization {
  userRoleAssignments: IUserAssigmentResponse[];
  representationType?: string;
  representedType?: string;
  representativeType?: string;
  representative?: IOrganizationRepresentative;
}

export interface IRequestCreateOrganization {
  name: string;
  description?: string;
}

export interface IRequestUpdateOrganization {
  name?: string;
  description?: string;
  metadata?: any;
}
