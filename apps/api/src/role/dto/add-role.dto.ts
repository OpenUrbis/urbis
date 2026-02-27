import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';

export class AddPermissionToRoleDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsNotEmpty()
  @IsEnum(RolePermissionScopeEnum)
  scope: RolePermissionScopeEnum = RolePermissionScopeEnum.OWN; // Default OWN, mas obrigatório
}
