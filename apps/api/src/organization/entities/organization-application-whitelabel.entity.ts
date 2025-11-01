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
import { ApplicationName } from '../enums/application-name.enum';
import { ApplicationTheme } from '../enums/application-theme.enum';
import { Organization } from './organization.entity';

@Entity('organization_application_whitelabels')
export class OrganizationApplicationWhitelabel extends BaseEntity {
  @PrimaryColumn()
  organizationId: string;

  @PrimaryColumn({
    type: 'enum',
    enum: ApplicationName,
  })
  application: ApplicationName;

  @Column({
    type: 'enum',
    enum: ApplicationTheme,
  })
  theme?: ApplicationTheme | null;

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
