import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('legis_categories')
export class LegisCategory {
  @PrimaryColumn({ type: 'varchar', length: 191 })
  @ApiProperty()
  id: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  @ApiProperty()
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  @ApiPropertyOptional()
  color?: string | null;

  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional()
  createdBy?: string | null;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}