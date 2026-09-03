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
import { ApplicationTheme } from '../enums/application-theme.enum';
import { Organization } from './organization.entity';

@Entity('organization_global_whitelabels')
export class OrganizationGlobalWhitelabel extends BaseEntity {
  @PrimaryColumn()
  organizationId: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  icons?: Record<ApplicationTheme, string> | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  logos?: Record<ApplicationTheme, string> | null;

  @Column({ nullable: true, length: 9 })
  primaryColor?: string | null;

  @OneToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
