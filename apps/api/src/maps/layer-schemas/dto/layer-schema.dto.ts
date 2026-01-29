import { ApiProperty } from '@nestjs/swagger';
import { ClickActionEnum } from '@open-urbis/map-shared';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  LayerSchemaColorTypeEnum,
  LayerSchemaTypeEnum,
} from 'maps/layer-schemas/enums/layer-schema.enum';

interface IClickAction {
  action: ClickActionEnum;
  params: Record<string, any>;
}

class LayerSchemaColorDto {
  @ApiProperty({
    example: [57, 118, 29, 175],
    description: 'Array of numbers representing RGBA color values',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  color: number[];

  @ApiProperty({
    enum: LayerSchemaColorTypeEnum,
    example: LayerSchemaColorTypeEnum.FILL,
    required: false,
    description: 'Type of color application for the layer schema',
  })
  @IsOptional()
  @IsEnum(LayerSchemaColorTypeEnum)
  type?: LayerSchemaColorTypeEnum;

  @ApiProperty({
    example: 'full',
    required: false,
    description: 'Pattern style for the color application',
  })
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiProperty({
    example: { getFillPatternScale: 1 },
    required: false,
    description: 'Pattern configuration (scale, offset, etc.)',
  })
  @IsOptional()
  @IsObject()
  patternConfig?: Record<string, any>;

  @ApiProperty({
    example: 'Partes de ferro',
    description: 'Label describing the color configuration',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    example: 'default',
    required: false,
    description:
      'Value used to compare with colorPropName and show color in layer',
  })
  @IsOptional()
  @IsString()
  value?: string;
}

export class LayerSchemaDto {
  @ApiProperty({
    example: 'iffel-tower',
    description: 'Unique identifier for the layer schema',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'Eiffel Tower',
    description: 'Name of the layer schema',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui%3Aview_lote_cidadao&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    description: 'URL source for the layer schema data',
  })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the layer schema is active',
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    enum: LayerSchemaTypeEnum,
    example: LayerSchemaTypeEnum.Stream,
    description: 'Type of layer schema',
  })
  @IsEnum(LayerSchemaTypeEnum)
  type: LayerSchemaTypeEnum;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Determines if the layer is visible',
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Index for sorting',
  })
  @IsOptional()
  @IsNumber()
  index?: number;

  @ApiProperty({
    example: 17,
    required: false,
    description: 'Minimum zoom level for layer visibility',
  })
  @IsOptional()
  @IsNumber()
  minZoom?: number;

  @ApiProperty({
    example: null,
    required: false,
    description: 'Property name for text color',
  })
  @IsOptional()
  @IsString()
  getTextColorPropName?: string;

  @ApiProperty({
    example: null,
    required: false,
    description: 'Property name for fill color',
  })
  @IsOptional()
  @IsString()
  getFillColorPropName?: string;

  @ApiProperty({
    example: null,
    required: false,
    description: 'Property name for line color',
  })
  @IsOptional()
  @IsString()
  getLineColorPropName?: string;

  @ApiProperty({
    example: { action: 'SelectFeature', params: {} },
    required: false,
    description: 'Action to perform on layer click',
  })
  @IsOptional()
  clickAction?: IClickAction;

  @ApiProperty({
    example: [{ type: 'wrapper-card', templates: [] }],
    required: false,
    description: 'Template for rendering layer view',
  })
  @IsOptional()
  @IsArray()
  viewTemplate?: Record<string, any>[];

  @ApiProperty({
    example: { stroked: false, filled: true, pointType: 'circle+text' },
    required: false,
    description: 'Additional properties for layer rendering',
  })
  @IsOptional()
  properties?: Record<string, any>;

  @ApiProperty({
    example: 'geral',
    required: false,
    description: 'Identifier of the associated layer group',
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({
    type: [LayerSchemaColorDto],
    example: [{ color: [57, 118, 29, 175], label: 'default' }],
    description: 'Array of color configurations for the layer',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayerSchemaColorDto)
  colors: LayerSchemaColorDto[];
}
