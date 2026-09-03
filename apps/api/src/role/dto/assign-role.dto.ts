import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { IsExist } from 'common/utils/validators/is-exists.validator';

export class AssignRoleDto {
  @ApiProperty({ example: 'userId' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsExist, ['User', 'id'])
  userId: string;

  @ApiProperty({ example: 'role' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsExist, ['Role', 'id'])
  roleId: string;

  @ApiPropertyOptional({ example: 'orgId' })
  @IsString()
  @IsOptional()
  @Validate(IsExist, ['Organization', 'id'])
  organizationId?: string;
}
