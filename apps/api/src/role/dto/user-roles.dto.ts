import { RoleTypeEnum } from 'role/enums/role-type.enum';

export interface UserRolesDto {
  permissions: string[];
  organization?: string;
  type: RoleTypeEnum;
}
