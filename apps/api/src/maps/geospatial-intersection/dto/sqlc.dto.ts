import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class SqlcDto {
  @ApiProperty({
    description: 'SQLC number in format XXX-XXX-XXXX',
    example: '123-456-7890',
  })
  @IsString()
  sqlc: string;

  @ApiProperty({
    description:
      'Optional array of fields to return. If not provided, all fields will be returned.',
    example: ['geom_subprefeitura', 'geom_distrito'],
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}
