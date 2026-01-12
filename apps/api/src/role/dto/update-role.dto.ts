import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsExist } from 'common/utils/validators/is-exists.validator';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { RoleStatusEnum } from 'role/enums/role-status.enum';
import { AddPermissionToRoleDto } from './add-role.dto';

export class UpdateRoleDto {
  @ApiProperty({ example: 'Administrador' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    example: 'Permite o usuário fazer ações especiais no sistema',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(RoleStatusEnum)
  status?: RoleStatusEnum;

  @IsOptional()
  @IsString()
  @Validate(IsExist, ['Organization', 'id'])
  organizationId?: string;

  @ApiProperty({
    example: [{ action: 'role:create', scope: RolePermissionScopeEnum.OWN }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPermissionToRoleDto)
  @ArrayMinSize(1)
  permissions?: AddPermissionToRoleDto[];
}
