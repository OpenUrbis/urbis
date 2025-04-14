import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

@Entity('layer_groups')
export class LayerGroup {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  ownerGroup?: string;

  @ManyToOne(() => LayerGroup, { nullable: true })
  @JoinColumn({ name: 'ownerGroup' }) // vincula a coluna ownerGroup como FK
  parentGroup?: LayerGroup;

  @OneToMany(() => LayerSchema, (layerSchema) => layerSchema.groupId, {
    nullable: true,
  })
  layerSchemas?: LayerSchema[];
}
