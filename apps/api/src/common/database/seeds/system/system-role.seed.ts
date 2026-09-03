import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Role } from '../../../../role/entities/role.entity';
import { RolePermission } from '../../../../role/entities/role-permission.entity';
import { Permission } from '../../../../role/entities/permission.entity';
import { UserRoleAssignment } from '../../../../role/entities/user-role-assignment.entity';
import { User } from '../../../../user/entities/user.entity';
import { RoleTypeEnum } from '../../../../role/enums/role-type.enum';
import { RolePermissionScopeEnum } from '../../../../role/enums/role-permission-scope.enum';
import { SYSTEM_ROLES } from './../../../../common/constants/system-roles.const';

@Injectable()
export class SystemRoleSeedService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepository: Repository<UserRoleAssignment>,
    private configService: ConfigService,
  ) {}

  private async createSystemRole() {
    const roleId = SYSTEM_ROLES.user;
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (role) {
      role.isDefault = true;
      role.name = 'Usuário';
      role.description = 'Cargo padrão para novos usuários';
      role.type = RoleTypeEnum.SYSTEM;
      await this.roleRepository.save(role);
    } else {
      const newRole = this.roleRepository.create({
        id: roleId,
        name: 'Usuário',
        description: 'Cargo padrão para novos usuários',
        type: RoleTypeEnum.SYSTEM,
        isDefault: true,
      });
      await this.roleRepository.save(newRole);
    }

    await this.roleRepository.update(
      { id: Not(roleId), isDefault: true },
      { isDefault: false },
    );

    // Sync default representation permissions for system user role
    const defaultPermissions = [
      {
        action: 'list',
        resource: 'representation',
        scope: RolePermissionScopeEnum.OWN,
      },
      {
        action: 'view',
        resource: 'representation',
        scope: RolePermissionScopeEnum.OWN,
      },
      {
        action: 'comment',
        resource: 'representation',
        scope: RolePermissionScopeEnum.OWN,
      },
    ];

    for (const item of defaultPermissions) {
      const permissionId = `${item.resource}:${item.action}`;
      let permission = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });

      if (!permission) {
        permission = await this.permissionRepository.findOne({
          where: { action: item.action, resource: item.resource },
        });
      }

      if (permission) {
        const existingRolePerm = await this.rolePermissionRepository.findOne({
          where: {
            role: { id: roleId },
            permission: { id: permission.id },
          },
        });

        if (!existingRolePerm) {
          const rolePermission = this.rolePermissionRepository.create({
            role: { id: roleId } as Role,
            permission,
            scope: item.scope,
          });
          await this.rolePermissionRepository.save(rolePermission);
        }
      }
    }

    // Re-assign system user role to all users currently missing it
    const systemOrgId = this.configService.get<string>('admin.organization.id');
    if (systemOrgId) {
      const allUsers = await this.userRepository.find();
      for (const user of allUsers) {
        const existingAssign = await this.userRoleAssignmentRepository.findOne({
          where: {
            userId: user.id,
            roleId: SYSTEM_ROLES.user,
            organizationId: systemOrgId,
          },
        });

        if (!existingAssign) {
          const assign = this.userRoleAssignmentRepository.create({
            userId: user.id,
            roleId: SYSTEM_ROLES.user,
            organizationId: systemOrgId,
          });
          await this.userRoleAssignmentRepository.save(assign);
        }
      }
    }
  }

  run() {
    return this.createSystemRole();
  }
}
