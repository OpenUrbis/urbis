import { LayerGroup } from 'layer-groups/entities/layer-group.entity';
import { LayerSchemaTypeEnum } from 'layer-schemas/enums/layer-schema.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { ClickActionEnum } from './../../../../common/enums/click-action.enum';
import { LayerSchemaColors } from './layer-schema-color.entity';

export interface IClickAction {
  action: ClickActionEnum;
  params: Record<string, any>;
}

@Entity('layer_schemas')
export class LayerSchema {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  origin: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: LayerSchemaTypeEnum,
    default: LayerSchemaTypeEnum.GeoJsonLayer,
  })
  type: LayerSchemaTypeEnum;

  @Column({ nullable: true })
  isVisible?: boolean;

  @Column({ nullable: true })
  canEditFeature?: boolean;

  @Column({ nullable: true })
  minZoom?: number;

  @Column({ nullable: true })
  getTextColorPropName?: string;

  @Column({ nullable: true })
  getFillColorPropName?: string;

  @Column({ nullable: true })
  getLineColorPropName?: string;

  @Column({ nullable: true, type: 'jsonb' })
  clickAction?: IClickAction;

  @Column({ nullable: true, type: 'jsonb' })
  viewTemplate?: Record<string, any>[];

  @Column({ nullable: true, type: 'jsonb', default: {} })
  properties?: Record<string, any>;

  @Column({ nullable: true })
  groupId?: string;

  @ManyToOne(() => LayerGroup, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  layerGroup?: LayerGroup;

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
