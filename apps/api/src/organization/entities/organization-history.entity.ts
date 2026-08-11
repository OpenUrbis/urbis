import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../../user/entities/user.entity';

export enum OrganizationHistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

@Entity('organization_history')
export class OrganizationHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor?: User;

  @Column({ nullable: true })
  actorId?: string;

  @Column({
    type: 'enum',
    enum: OrganizationHistoryAction,
  })
  action: OrganizationHistoryAction;

  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
