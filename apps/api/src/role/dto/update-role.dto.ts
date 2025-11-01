import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

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
  description?: string | null;

  @ApiProperty({
    example: [
      'role:create',
      'role:update',
      'role:assign',
      'role:unassign',
      'user:create',
      'user:update',
      'user:delete',
      'auth:reset-2fa',
      'auth:reset-password',
      'organization:create',
      'organization:update',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  permissions: string[];
}
