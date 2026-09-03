import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LayerSchema } from './../../layer-schemas/entities/layer-schema.entity';

@Entity('layer_groups')
@Index(['id'], { unique: true, where: '"deletedAt" IS NULL' })
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

  @ApiProperty({ description: 'Index for sorting', example: 10 })
  @Column({ nullable: true })
  index?: number;

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

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
