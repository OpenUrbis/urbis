import { ApiProperty } from '@nestjs/swagger';
import { ClickActionEnum } from '@open-urbis/map-shared';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { LayerGroup } from './../../layer-groups/entities/layer-group.entity';
import { LayerSchemaTypeEnum } from './../enums/layer-schema.enum';
import { LayerSchemaColors } from './layer-schema-color.entity';

export interface IClickAction {
  action: ClickActionEnum;
  params: Record<string, any>;
}

@Entity('layer_schemas')
export class LayerSchema {
  @ApiProperty({
    example: 'lotes',
    description: 'Unique identifier for the layer schema',
  })
  @PrimaryColumn()
  id: string;

  @ApiProperty({
    example: 'Lotes',
    description: 'Descriptive name of the layer schema',
  })
  @Column()
  name: string;

  @ApiProperty({
    example:
      'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=slui%3Aview_lote_cidadao&maxFeatures=10000&outputFormat=json&srsName=EPSG:4326',
    description:
      'URL source providing the geospatial data for the layer schema',
  })
  @Column()
  origin: string;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the layer schema is currently active',
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    enum: LayerSchemaTypeEnum,
    example: LayerSchemaTypeEnum.Stream,
    description: 'Type of layer schema (e.g., Stream, GeoJsonLayer)',
  })
  @Column({
    type: 'enum',
    enum: LayerSchemaTypeEnum,
    default: LayerSchemaTypeEnum.GeoJsonLayer,
  })
  type: LayerSchemaTypeEnum;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Determines whether the layer is visible on the map',
  })
  @Column({ nullable: true })
  isVisible?: boolean;

  @ApiProperty({
    example: 17,
    required: false,
    description: 'Minimum zoom level at which the layer becomes visible',
  })
  @Column({ nullable: true })
  minZoom?: number;

  @ApiProperty({
    example: null,
    required: false,
    description:
      'Property name used to determine the text color of layer features',
  })
  @Column({ nullable: true })
  getTextColorPropName?: string;

  @ApiProperty({
    example: null,
    required: false,
    description:
      'Property name used to determine the fill color of layer features',
  })
  @Column({ nullable: true })
  getFillColorPropName?: string;

  @ApiProperty({
    example: null,
    required: false,
    description:
      'Property name used to determine the line color of layer features',
  })
  @Column({ nullable: true })
  getLineColorPropName?: string;

  @ApiProperty({
    example: { action: 'SelectFeature', params: {} },
    required: false,
    description:
      'Action to be performed when the layer is clicked, with optional parameters',
  })
  @Column({ nullable: true, type: 'jsonb' })
  clickAction?: IClickAction;

  @ApiProperty({
    example: [
      {
        type: 'wrapper-card',
        templates: [
          {
            type: 'label-value',
            label: 'Identificação',
            value: `<h3>#<%- properties.id.replace("lote_cidadao.", "") %></h3>`,
          },
        ],
      },
    ],
    required: false,
    description: 'Template configuration for rendering the layer’s view',
  })
  @Column({ nullable: true, type: 'jsonb' })
  viewTemplate?: Record<string, any>[];

  @ApiProperty({
    example: {
      stroked: false,
      filled: true,
      pointType: 'circle+text',
      pickable: true,
      extruded: true,
      wireframe: true,
      getLineWidth: 20,
    },
    required: false,
    description:
      'Additional rendering properties for the layer (e.g., styling, behavior)',
  })
  @Column({ nullable: true, type: 'jsonb', default: {} })
  properties?: Record<string, any>;

  @ApiProperty({
    example: 'geral',
    required: false,
    description: 'Identifier of the layer group to which this schema belongs',
  })
  @Column({ nullable: true })
  groupId?: string;

  @ManyToOne(() => LayerGroup, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  layerGroup?: LayerGroup;

  @ApiProperty({ description: 'List of colors', example: [LayerSchemaColors] })
  @OneToMany(
    () => LayerSchemaColors,
    (layerSchemaColors) => layerSchemaColors.layerSchema,
    {
      cascade: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      orphanedRowAction: 'delete',
      nullable: false,
    },
  )
  colors?: LayerSchemaColors[];
}
