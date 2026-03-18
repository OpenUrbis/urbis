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
import { Representation } from './representation.entity';

@Entity('representation_comments')
export class RepresentationComment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Representation, (representation) => representation.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'representationId' })
  representation: Representation;

  @Column()
  representationId: string;

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
