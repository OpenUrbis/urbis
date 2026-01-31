import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for subgroups
export class SubGroupDto {
  @ApiProperty({
    description: 'Unique identifier for the subgroup',
    example: 'macrozoneamento',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Name of the subgroup',
    example: 'Macrozoneamento - Lei nº 16.050/14',
  })
  @IsString()
  name: string;
}

// Main DTO for LayerGroup
export class LayerGroupDto {
  @ApiProperty({
    description: 'Unique identifier for the layer group',
    example: 'urbanistico',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Name of the layer group',
    example: 'Urbanístico',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'List of subgroups within the layer group',
    type: () => [SubGroupDto],
    required: false,
    example: [
      { id: 'macrozoneamento', name: 'Macrozoneamento - Lei nº 16.050/14' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubGroupDto)
  subGroups?: SubGroupDto[];
}
