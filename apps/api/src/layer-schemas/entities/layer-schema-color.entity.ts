import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';
import { LayerSchemaColorTypeEnum } from 'layer-schemas/enums/layer-schema.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @Column()
  label: string;

  @Column({ nullable: true })
  value?: string;

  @Column({ nullable: true })
  layerSchemaId?: string;

  @ManyToOne(() => LayerSchema, (layerSchema) => layerSchema.colors, {
    nullable: true,
  })
  @JoinColumn({ name: 'layerSchemaId' })
  layerSchema?: LayerSchema;
}
