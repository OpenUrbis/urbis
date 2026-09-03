import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('legis_authorities')
export class LegisAuthority {
  @PrimaryColumn({ type: 'varchar', length: 191 })
  @ApiProperty()
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional()
  complementFull?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  @ApiPropertyOptional()
  complementAbbr?: string | null;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty()
  commonRefFull: string;

  @Column({ type: 'varchar', length: 120 })
  @ApiProperty()
  commonRefAbbr: string;

  @Column({ type: 'varchar', length: 10 })
  @ApiProperty()
  startDate: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @ApiPropertyOptional()
  endDate?: string | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  @ApiPropertyOptional()
  pageId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional()
  createdBy?: string | null;

  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional()
  updatedBy?: string | null;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
