import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { LayerSchema } from './../../layer-schemas/entities/layer-schema.entity';

@Entity('layer_groups')
export class LayerGroup {
  @ApiProperty({ description: 'Unique identifier', example: 'geral' })
  @PrimaryColumn()
  id: string;

  @ApiProperty({ description: 'Name of group', example: 'Geral' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Owner group', example: 'test' })
  @Column({ nullable: true })
  ownerGroup?: string;

  @ManyToOne(() => LayerGroup, { nullable: true })
  @JoinColumn({ name: 'ownerGroup' })
  @ApiPropertyOptional()
  parentGroup?: LayerGroup;

  @OneToMany(() => LayerSchema, (layerSchema) => layerSchema.groupId, {
    nullable: true,
  })
  @ApiPropertyOptional()
  layerSchemas?: LayerSchema[];

  @OneToMany(() => LayerGroup, (layerGroup) => layerGroup.parentGroup, {
    nullable: true,
  })
  @ApiPropertyOptional()
  childGroups?: LayerGroup[];
}
