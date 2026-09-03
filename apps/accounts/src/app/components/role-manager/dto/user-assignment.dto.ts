import { IOrganization } from '../../../pages/organizations/dto/organization.dto';
import { IRoleResponse } from './role.dto';

export interface IUserAssigmentResponse {
  id: string;
  userId: string;
  roleId: string;
  organizationId: string;
  assignAt: string;
  role: IRoleResponse;
  organization: IOrganization;
}
