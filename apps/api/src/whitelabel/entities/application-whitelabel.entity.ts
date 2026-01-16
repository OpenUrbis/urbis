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
import { Expose } from 'class-transformer';
import { Organization } from '../../organization/entities/organization.entity';

@Entity('application_whitelabels')
export class ApplicationWhitelabel extends BaseEntity {
  @PrimaryColumn()
  @Expose()
  organizationId: string;

  @PrimaryColumn({
    type: 'enum',
    enum: ApplicationName,
  })
  @Expose()
  application: ApplicationName;

  @Column({
    type: 'enum',
    enum: ApplicationTheme,
  })
  @Expose()
  theme?: ApplicationTheme;

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
