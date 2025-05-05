import { ApiProperty } from '@nestjs/swagger';
import { ClickActionEnum } from '@open-urbis/map-shared';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { LayerSchema } from './../../layer-schemas/entities/layer-schema.entity';
import { SearchConfigMethodEnum } from './../enums/search-config.enum';

export interface IClickAction {
  action: ClickActionEnum;
  params: Record<string, any>;
}

@Entity('search_config')
export class SearchConfig {
  @ApiProperty({ description: '', example: 1 })
  @PrimaryColumn()
  id: string;

  @ApiProperty({ description: '', example: 'Lotes' })
  @Column()
  name: string;

  @ApiProperty({ description: '', example: 'https://localhost:3000' })
  @Column()
  origin: string;

  @ApiProperty({ description: '', example: 'GET' })
  @Column({
    default: SearchConfigMethodEnum.GET,
    nullable: true,
    type: 'enum',
    enum: SearchConfigMethodEnum,
  })
  method?: SearchConfigMethodEnum;

  @ApiProperty({ description: '', example: 0 })
  @Column()
  index: number;

  @ApiProperty({ description: '', example: true })
  @Column({ default: true })
  isActive?: boolean;

  @ApiProperty({ description: '', example: '() => ({})' })
  @Column({ nullable: true })
  transformParams?: string;

  @ApiProperty({ description: '', example: '() => ({})' })
  @Column({ nullable: true })
  transformRequest?: string;

  @ApiProperty({ description: '', example: '() => ({})' })
  @Column({ nullable: true })
  transformResponse?: string;

  @ApiProperty({
    description: '',
    example: {
      action: ClickActionEnum.SetZoom,
      params: { zoom: 12 },
    },
  })
  @Column({ nullable: true, type: 'jsonb', default: `{}` })
  clickAction?: IClickAction;

  @ApiProperty({ description: '', example: 'lotes' })
  @Column({ nullable: true })
  layerSchemaId?: string;

  @OneToOne(() => LayerSchema, { nullable: true })
  @JoinColumn({ name: 'layerSchemaId' })
  layerSchema?: LayerSchema;
}
