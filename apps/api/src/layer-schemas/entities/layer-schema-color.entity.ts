import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('layer_schemas_colors')
export class LayerSchemaColors {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: string;

  @Column({ type: 'jsonb' })
  color: number[];

  @Column({ default: 'full' })
  pattern: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  value?: string;

  @Column()
  layerSchemaId?: string;

  @ManyToOne(() => LayerSchema, (layerSchema) => layerSchema.id, {})
  layerSchema?: LayerSchema;
}
