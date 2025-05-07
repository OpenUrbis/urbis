import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClickActionEnum } from '@open-urbis/map-shared';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { LayerSchema } from '../../layer-schemas/entities/layer-schema.entity';
import { SearchConfigMethodEnum } from '../enums/search-config.enum';

export interface IClickAction {
  action: ClickActionEnum;
  params: Record<string, any>;
}

@Entity('search_config')
export class SearchConfig {
  @ApiProperty({ description: 'Unique identifier', example: 1 })
  @PrimaryColumn()
  id: string;

  @ApiProperty({ description: 'Name of the list', example: 'Lotes' })
  @Column()
  name: string;

  @ApiProperty({
    description: 'URL to call when search is called',
    example: 'https://localhost:3000',
  })
  @Column()
  origin: string;

  @ApiPropertyOptional({
    description: 'HTTP Method',
    example: SearchConfigMethodEnum.GET,
  })
  @Column({
    default: SearchConfigMethodEnum.GET,
    nullable: true,
    type: 'enum',
    enum: SearchConfigMethodEnum,
  })
  method?: SearchConfigMethodEnum;

  @ApiProperty({
    description: 'Index order on visualization of front end',
    example: 0,
  })
  @Column()
  index: number;

  @ApiPropertyOptional({
    description: 'If is active to use in front end',
    example: true,
  })
  @Column({ default: true })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Function to transform query params before request',
    example: '() => ({})',
  })
  @Column({ nullable: true })
  transformParams?: string;

  @ApiPropertyOptional({
    description: 'Function to transform header and body before request',
    example: '() => ({})',
  })
  @Column({ nullable: true })
  transformRequest?: string;

  @ApiPropertyOptional({
    description: 'Function to transform response of API',
    example: '() => ({})',
  })
  @Column({ nullable: true })
  transformResponse?: string;

  @ApiPropertyOptional({
    description: 'Configuration of when click action in option',
    example: {
      action: 'setZoom',
      params: { zoom: 12 },
    },
  })
  @Column({ nullable: true, type: 'jsonb', default: `{}` })
  clickAction?: IClickAction;

  @ApiPropertyOptional({
    description: 'Refer of layer schema object',
    example: 'lotes',
  })
  @Column({ nullable: true })
  layerSchemaId?: string;

  @ApiPropertyOptional({
    description: 'Layer schema object',
    example: LayerSchema,
  })
  @OneToOne(() => LayerSchema, { nullable: true })
  @JoinColumn({ name: 'layerSchemaId' })
  layerSchema?: LayerSchema;
}
