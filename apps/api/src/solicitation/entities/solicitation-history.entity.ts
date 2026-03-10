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
import { SolicitationStatus } from '../enums/solicitation-status.enum';
import { Solicitation } from './solicitation.entity';

@Entity('solicitation_history')
export class SolicitationHistory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Solicitation, (solicitation) => solicitation.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'solicitationId' })
  solicitation: Solicitation;

  @Column()
  solicitationId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ nullable: true })
  actorId: string;

  @Column()
  action: string;

  @Column({
    type: 'enum',
    enum: SolicitationStatus,
    nullable: true,
  })
  previousStatus: SolicitationStatus;

  @Column({
    type: 'enum',
    enum: SolicitationStatus,
    nullable: true,
  })
  newStatus: SolicitationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
