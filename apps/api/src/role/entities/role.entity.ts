import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { RoleStatusEnum } from '../enums/role-status.enum';
import { RoleTypeEnum } from '../enums/role-type.enum';
import { Permission } from './permission.entity';
import { UserRoleAssignment } from './user-role-assignment.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string | null;

  @Column({
    type: 'enum',
    enum: RoleStatusEnum,
    default: RoleStatusEnum.ACTIVE,
  })
  status: RoleStatusEnum;

  @Column({ type: 'enum', enum: RoleTypeEnum, default: RoleTypeEnum.USER })
  type: RoleTypeEnum;

  @Column({ nullable: true })
  organizationId?: string | null;
  @ManyToOne(
    () => Organization,
    (organization) => organization.userRoleAssignments,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinColumn({ name: 'roleId' })
  @JoinTable({ name: 'role_permissions' })
  permissions: Permission[];

  @OneToMany(() => UserRoleAssignment, (ura) => ura.role)
  userRoleAssignments: UserRoleAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
