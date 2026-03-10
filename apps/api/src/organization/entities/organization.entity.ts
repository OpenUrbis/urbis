import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRoleAssignment } from '../../role/entities/user-role-assignment.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ nullable: true, unique: true })
  document?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json', default: {} })
  metadata: any;

  @OneToMany(() => UserRoleAssignment, (ura) => ura.organization)
  userRoleAssignments: UserRoleAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
