import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Solicitation } from './solicitation.entity';

@Entity('solicitation_comments')
export class SolicitationComment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Solicitation, (solicitation) => solicitation.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'solicitationId' })
  solicitation: Solicitation;

  @Column()
  solicitationId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @Column('text')
  text: string;

  @Column('text', { array: true, nullable: true })
  attachments?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
