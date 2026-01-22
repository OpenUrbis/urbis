import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Organização' })
  @IsNotEmpty()
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
