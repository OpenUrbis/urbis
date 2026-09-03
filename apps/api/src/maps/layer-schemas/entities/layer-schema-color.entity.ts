import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LayerSchemaColorTypeEnum } from './../enums/layer-schema.enum';
import { LayerSchema } from './layer-schema.entity';

@Entity('layer_schemas_colors')
export class LayerSchemaColors {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id?: string;

  @Column({ type: 'jsonb' })
  color: number[];

  @Column({
    type: 'enum',
    enum: LayerSchemaColorTypeEnum,
    nullable: true,
    default: LayerSchemaColorTypeEnum.FILL,
  })
  type?: LayerSchemaColorTypeEnum;

  @Column({ default: 'full' })
  pattern?: string;

  @Column({ type: 'jsonb', nullable: true })
  patternConfig?: Record<string, any>;

  @Column()
  label: string;

  @Column({ nullable: true })
  value?: string;

  @Column({ nullable: true })
  legisUrl?: string;

  @Column({ nullable: false })
  layerSchemaId?: string;

  @ManyToOne(() => LayerSchema, (layerSchema) => layerSchema.colors, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'layerSchemaId' })
  layerSchema?: LayerSchema;
}
