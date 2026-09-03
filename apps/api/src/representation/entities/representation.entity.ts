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
import { RepresentationStatus } from '../enums/representation-status.enum';
import { RepresentationType } from '../enums/representation-type.enum';
import { RepresentationComment } from './representation-comment.entity';
import { RepresentationHistory } from './representation-history.entity';

@Entity('representations')
export class Representation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RepresentationType,
  })
  type: RepresentationType;

  @Column({
    type: 'enum',
    enum: RepresentationStatus,
    default: RepresentationStatus.PENDING,
  })
  status: RepresentationStatus;

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

  @Column({ type: 'text', nullable: true })
  representationType?: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author?: Organization;

  @Column({ nullable: true })
  authorId?: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'representedId' })
  represented?: Organization;

  @Column({ nullable: true })
  representedId?: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'representativeId' })
  representative?: Organization;

  @Column({ nullable: true })
  representativeId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: User;

  @Column({ nullable: true })
  assignedToId?: string;

  @Column({ type: 'text', nullable: true })
  justification?: string;

  @Column({ type: 'varchar', default: 'CONFERENCE' })
  validationProcedure: 'CONFERENCE' | 'DECLARATORY';

  @Column({ type: 'jsonb', nullable: true })
  documents?: Array<{ category: string; files: string[] }>;

  @Column({ type: 'jsonb', nullable: true })
  coRepresentatives?: string[];

  @Column({ default: false })
  requiresJointAgreement: boolean;

  @OneToMany(() => RepresentationComment, (comment) => comment.representation)
  comments: RepresentationComment[];

  @OneToMany(() => RepresentationHistory, (history) => history.representation)
  history: RepresentationHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
