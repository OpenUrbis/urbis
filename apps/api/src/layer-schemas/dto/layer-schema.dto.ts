import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';

// DTO for mapLegend items
export class MapLegendItemDto {
  @ApiProperty({ description: 'Label for the legend item', example: 'High' })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'RGBA color array with 4 numbers',
    example: [255, 0, 0, 255],
  })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsNumber({}, { each: true })
  color: number[];
}

// Custom validator for properties that can be string or number array
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { LayerSchemaTypeEnum } from 'layer-schemas/enums/layer-schema.enum';

@ValidatorConstraint({ name: 'isColor', async: false })
export class IsColorConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value === 'string') return true;
    if (
      Array.isArray(value) &&
      value.length === 4 &&
      value.every((item) => typeof item === 'number')
    )
      return true;
    return false;
  }

  defaultMessage(): string {
    return 'Must be either a string or an array of 4 numbers';
  }
}

// Main DTO for Layer Schema
export class LayerSchemaDto {
  @ApiProperty({
    description: 'Type of the layer',
    enum: LayerSchemaTypeEnum,
    example: 'GeoJsonLayer',
  })
  @IsEnum(LayerSchemaTypeEnum)
  '@@type': LayerSchemaTypeEnum;

  @ApiProperty({
    description: 'Unique identifier for the layer',
    example: 'layer1',
  })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Name of the layer', example: 'River Layer' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Visibility of the layer', example: true })
  @IsBoolean()
  visible: boolean;

  @ApiProperty({
    description: 'Fill color, either as RGBA array or string',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4 },
    ],
    example: [0, 128, 255, 255],
  })
  @IsOptional()
  @Validate(IsColorConstraint)
  getFillColor?: string | number[];

  @ApiProperty({ description: 'Minimum zoom level', example: 5 })
  @IsOptional()
  @IsNumber()
  minZoom?: number;

  @ApiProperty({
    description: 'Data source or content',
    example: 'geojson data',
  })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiProperty({ description: 'Group identifier', example: 'group1' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({ description: 'Text to display', example: 'River Name' })
  @IsOptional()
  @IsString()
  getText?: string;

  @ApiProperty({
    description: 'Text color as RGBA array',
    example: [0, 0, 0, 255],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsNumber({}, { each: true })
  getTextColor?: number[];

  @ApiProperty({
    description: 'Line color, either as RGBA array or string',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4 },
    ],
    example: '#FF0000',
  })
  @IsOptional()
  @Validate(IsColorConstraint)
  getLineColor?: string | number[];

  @ApiProperty({ description: 'Text size', example: 12 })
  @IsOptional()
  @IsNumber()
  getTextSize?: number;

  @ApiProperty({ description: 'Enable auto-highlight', example: false })
  @IsOptional()
  @IsBoolean()
  autoHighlight?: boolean;

  @ApiProperty({
    description: 'Highlight color as RGBA array',
    example: [255, 255, 0, 128],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsNumber({}, { each: true })
  highlightColor?: number[];

  @ApiProperty({
    description: 'Legend items for the map',
    type: () => [MapLegendItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MapLegendItemDto)
  mapLegend?: MapLegendItemDto[];

  @ApiProperty({
    description: 'URL template for the layer',
    example: 'https://example.com/{z}/{x}/{y}.png',
  })
  @IsOptional()
  @IsString()
  urlTemplate?: string;
}
