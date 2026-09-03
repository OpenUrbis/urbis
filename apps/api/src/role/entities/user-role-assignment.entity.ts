import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { User } from '../../user/entities/user.entity';
import { Role } from './role.entity';

@Entity('user_role_assignments')
export class UserRoleAssignment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'roleId' })
  roleId: string;

  @Column({ name: 'organizationId', nullable: true })
  organizationId?: string;

  @CreateDateColumn({ name: 'assignAt' })
  assignAt: Date;

  @ManyToOne(() => User, (user) => user.userRoleAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoleAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(
    () => Organization,
    (organization) => organization.userRoleAssignments,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
