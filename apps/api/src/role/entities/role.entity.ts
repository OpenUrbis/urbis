import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import {
  AfterLoad,
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
import { Organization } from '../../organization/entities/organization.entity';
import { RoleStatusEnum } from '../enums/role-status.enum';
import { RoleTypeEnum } from '../enums/role-type.enum';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { UserRoleAssignment } from './user-role-assignment.entity';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';

export type InternalPermission = Pick<
  Permission,
  | 'action'
  | 'name'
  | 'description'
  | 'resource'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
> & {
  scope: RolePermissionScopeEnum;
};

@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: RoleStatusEnum,
    default: RoleStatusEnum.ACTIVE,
  })
  status: RoleStatusEnum;

  @Column({ type: 'enum', enum: RoleTypeEnum, default: RoleTypeEnum.USER })
  type: RoleTypeEnum;

  @Column({ nullable: true })
  organizationId?: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ManyToOne(
    () => Organization,
    (organization) => organization.userRoleAssignments,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => RolePermission, (rp) => rp.role, { eager: true })
  rolePermissions: RolePermission[];

  permissions?: InternalPermission[];

  @OneToMany(() => UserRoleAssignment, (ura) => ura.role)
  userRoleAssignments: UserRoleAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  isSystemRole: boolean;

  @AfterLoad()
  populatePermissions() {
    if (this.rolePermissions) {
      this.permissions = [];
      this.rolePermissions.forEach(({ permission, scope }) =>
        this.permissions.push({ ...permission, scope }),
      );
    }
  }

  @AfterLoad()
  setSystemRoleFlag() {
    if (Object.values(SYSTEM_ROLES).includes(this.id)) {
      this.isSystemRole = true;
    }
  }
}
