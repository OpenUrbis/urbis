import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { RepresentationStatus } from '../enums/representation-status.enum';
import { Representation } from './representation.entity';

@Entity('representation_history')
export class RepresentationHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Representation, (representation) => representation.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'representationId' })
  representation: Representation;

  @Column()
  representationId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ nullable: true })
  actorId: string;

  @Column()
  action: string;

  @Column({
    type: 'enum',
    enum: RepresentationStatus,
    nullable: true,
  })
  previousStatus: RepresentationStatus;

  @Column({
    type: 'enum',
    enum: RepresentationStatus,
    nullable: true,
  })
  newStatus: RepresentationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
