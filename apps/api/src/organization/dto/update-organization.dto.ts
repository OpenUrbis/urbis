import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiProperty({ example: 'Organização' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Descrição' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ example: {} })
  @IsObject()
  @IsOptional()
  metadata: any;

  @ApiProperty({ example: 'uuid' })
  @IsString()
  @IsOptional()
  parentId: string;
}
