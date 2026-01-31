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
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  origin: string;

  @Column({
    default: SearchConfigMethodEnum.GET,
    nullable: true,
    type: 'enum',
    enum: SearchConfigMethodEnum,
  })
  method?: SearchConfigMethodEnum;

  @Column()
  index: number;

  @Column({ default: true })
  isActive?: boolean;

  @Column({ nullable: true })
  transformParams?: string;

  @Column({ nullable: true })
  transformRequest?: string;

  @Column({ nullable: true })
  transformResponse?: string;

  @Column({ nullable: true, type: 'jsonb', default: `{}` })
  clickAction?: IClickAction;

  @Column({ nullable: true })
  layerSchemaId?: string;

  @OneToOne(() => LayerSchema, { nullable: true })
  @JoinColumn({ name: 'layerSchemaId' })
  layerSchema?: LayerSchema;
}
