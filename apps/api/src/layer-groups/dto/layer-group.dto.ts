import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Owner group, if have',
    example: 'geral',
  })
  @IsString()
  @IsOptional()
  ownerGroup?: string;
}
