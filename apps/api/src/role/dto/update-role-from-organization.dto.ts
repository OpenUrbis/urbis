import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, Validate } from 'class-validator';
import { IsExist } from 'common/utils/validators/is-exists.validator';

export class UpdateRoleFromOrganizationDto {
  @ApiProperty({ example: ['roleId'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Validate(IsExist, ['Role', 'id'], { each: true })
  roleIds: string[];

  @ApiProperty({ example: 'userId' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsExist, ['User', 'id'])
  userId: string;
}
