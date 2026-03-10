import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { SolicitationStatus } from '../enums/solicitation-status.enum';
import { SolicitationType } from '../enums/solicitation-type.enum';
import { SolicitationComment } from './solicitation-comment.entity';
import { SolicitationHistory } from './solicitation-history.entity';

@Entity('solicitations')
export class Solicitation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SolicitationType,
  })
  type: SolicitationType;

  @Column({
    type: 'enum',
    enum: SolicitationStatus,
    default: SolicitationStatus.PENDING,
  })
  status: SolicitationStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column({ nullable: true })
  requesterId: string;

  @ManyToOne(() => Organization, { eager: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: User;

  @Column({ nullable: true })
  assignedToId?: string;

  @Column({ type: 'text', nullable: true })
  justification?: string;

  @Column('text', { array: true, nullable: true })
  documents?: string[];

  @OneToMany(() => SolicitationComment, (comment) => comment.solicitation)
  comments: SolicitationComment[];

  @OneToMany(() => SolicitationHistory, (history) => history.solicitation)
  history: SolicitationHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
