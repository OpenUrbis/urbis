import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { Organization } from '../../organization/entities/organization.entity';
import { ISharedWhitelabelLayout } from '../types/shared-whitelabel-layout';

@Entity('shared_whitelabels')
export class SharedWhitelabel extends BaseEntity {
  @PrimaryColumn()
  @Expose()
  organizationId: string;

  @Column({ nullable: true, length: 9 })
  @Expose()
  primaryColor?: string;

  @Column({ nullable: true, type: 'jsonb' })
  @Expose()
  layout?: ISharedWhitelabelLayout;

  @OneToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  @Expose()
  organization: Organization;

  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;

  @DeleteDateColumn()
  @Expose()
  deletedAt: Date;
}
