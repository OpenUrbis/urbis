import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SearchCategory } from './../interfaces/geocoding.interface';

export class GeocodingQueryDto {
  @ApiProperty({
    description: 'Search term for geocoding',
    example: 'São Paulo',
  })
  @IsString()
  search: string;

  @ApiProperty({
    description: 'Geocoding service (provider or nominatim)',
    example: 'nominatim',
    required: false,
  })
  @IsOptional()
  @IsString()
  service?: string;
}

export class SearchResultDto {
  @ApiProperty({ description: 'Unique identifier of the result' })
  id: string;

  @ApiProperty({ description: 'Name of the place' })
  name: string;

  @ApiProperty({ description: 'Type of the place (e.g., LOTE, DISTRITO)' })
  type: string;

  @ApiProperty({ description: 'Latitude of the place' })
  latitude: number;

  @ApiProperty({ description: 'Longitude of the place' })
  longitude: number;

  @ApiProperty({
    description: 'Category of the result',
    enum: ['Lotes', 'Distritos', 'Outros'],
    required: false,
  })
  category?: SearchCategory;

  @ApiProperty({ description: 'Raw API data', required: false })
  rawData?: any;
}
