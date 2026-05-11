import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IClickAction } from 'maps/layer-schemas/entities/layer-schema.entity';
import { SearchConfigMethodEnum } from 'maps/search/enums/search-config.enum';

export class SearchConfigDto {
  @ApiProperty({
    description: 'Unique identifier for the search config',
    example: 'monument',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Name used to show in layout',
    example: 'Monumentos',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'URL used to request',
    example: 'https://localhost:3000',
  })
  @IsNotEmpty()
  @IsString()
  origin: string;

  @ApiProperty({
    description: 'Method HTTP used to request',
    example: 'GET',
    default: 'GET',
    enum: SearchConfigMethodEnum,
  })
  @IsOptional()
  @IsString()
  @IsEnum(SearchConfigMethodEnum)
  method?: SearchConfigMethodEnum;

  @ApiProperty({ description: 'Number to order searchs', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  index: number;

  @ApiProperty({ description: 'If is active or not', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Function to transform query params before request',
    example: '({term}) => ({term})',
  })
  @IsOptional()
  @IsString()
  transformParams?: string;

  @ApiProperty({
    description: 'Filter Tree structure',
    example: {},
  })
  @IsOptional()
  filterTree?: any;

  @ApiProperty({
    description: 'Function to transform body before request',
    example: '() => ({})',
  })
  @IsOptional()
  @IsString()
  transformRequest?: string;

  @ApiProperty({
    description: 'Function to transform query params before request',
    example:
      '(data) => ({id: "1", latitude: 0, longitude: 0, name: "Test", rawData: {}})',
  })
  @IsOptional()
  @IsString()
  transformResponse?: string;

  @ApiProperty({
    description: 'Click action configuration',
    example: 'null',
  })
  @IsOptional()
  clickAction?: IClickAction;

  @ApiProperty({
    description: 'Layer Schema with actions',
    example: 'iffel-tower',
  })
  @IsOptional()
  @IsString()
  layerSchemaId?: string;
}
