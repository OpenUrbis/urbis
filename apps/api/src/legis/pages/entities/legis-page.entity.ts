import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('legis_pages')
@Index(['title'])
@Index(['type'])
@Index(['categoryId'])
@Index(['isPublic'])
@Index(['authorId'])
@Index(['createdAt'])
export class LegisPage {
  @PrimaryColumn({ type: 'varchar', length: 191 })
  @ApiProperty()
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty()
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @ApiProperty()
  slug: string;

  @Column({ type: 'varchar', length: 80, default: 'page' })
  @ApiProperty()
  type: string;

  /**
   * Display label for the responsible party. Filled from `authorId` when the
   * page is written through the API and kept as free text only for imported or
   * legacy content that has no matching system user.
   */
  @Column({ type: 'varchar', length: 255, default: 'Desconhecido' })
  @ApiProperty()
  author: string;

  /** System user (users.id) credited as the author of the content. */
  @Column({ type: 'uuid', nullable: true })
  @ApiPropertyOptional()
  authorId?: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  @ApiProperty({ type: [String] })
  tags: string[];

  @Column({ type: 'varchar', length: 191, nullable: true })
  @ApiPropertyOptional()
  categoryId?: string | null;

  @Column({ type: 'boolean', default: false })
  @ApiProperty()
  isPublic: boolean;

  @Column({ type: 'text' })
  @ApiProperty()
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { url: 'https://example.org/norma', type: 'html' },
  })
  source?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  @ApiPropertyOptional()
  entityType?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  entityData?: Record<string, unknown> | null;

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
