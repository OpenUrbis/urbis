import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Administrador' })
  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  @ArrayMinSize(1)
  permissions: string[];
}
