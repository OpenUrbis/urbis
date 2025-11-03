import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { Equal, ILike, IsNull, Or, Repository } from 'typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { AddPermissionToRoleDto } from './dto/add-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { PermissionService } from './permission/permission.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepository: Repository<UserRoleAssignment>,

    private readonly permissionService: PermissionService,
  ) {}

  findOne(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  private async syncPermissions(
    roleId: string,
    dtos: AddPermissionToRoleDto[],
  ): Promise<void> {
    const role = await this.findOne(roleId);

    await this.rolePermissionRepository.delete({ role: { id: roleId } });

    for (const dto of dtos) {
      const permission = await this.permissionService.findOne(dto.action);
      if (!permission) {
        throw new NotFoundException(
          `Permission action ${dto.action} not found`,
        );
      }

      const rolePermission = this.rolePermissionRepository.create({
        role,
        permission,
        scope: dto.scope,
      });
      await this.rolePermissionRepository.save(rolePermission);
    }
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { permissions, name, description, organizationId } = createRoleDto;

    const role = this.roleRepository.create({ name, description });
    console.log('PUPU', role);
    if (organizationId) {
      role.organization = { id: organizationId } as Organization;
    }
    await this.roleRepository.save(role);

    if (permissions && permissions.length > 0) {
      await this.syncPermissions(role.id, permissions);
    }

    return this.findOne(role.id);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { permissions, ...roleData } = updateRoleDto;
    const role = await this.findOne(id);
    Object.assign(role, roleData);
    if (roleData.organizationId) {
      role.organization = { id: roleData.organizationId } as Organization;
    }
    await this.roleRepository.save(role);

    if (permissions) {
      await this.syncPermissions(id, permissions);
    }

    return this.findOne(id);
  }

  async assign(data: AssignRoleDto) {
    const { userId, roleId, organizationId } = data;
    const assign = await this.userRoleAssignmentRepository.findOne({
      where: {
        userId,
        roleId,
        organizationId,
      },
    });
    if (!assign)
      return this.userRoleAssignmentRepository.save({
        userId,
        roleId,
        organizationId,
      });
    else return assign;
  }

  async unassign(id: string) {
    await this.userRoleAssignmentRepository.delete({ id });

    return { message: 'OK' };
  }

  async listUserRoles(userId: string, orgId?: string) {
    const assignments = await this.userRoleAssignmentRepository.find({
      where: {
        userId,
        organizationId: orgId ? Or(Equal(orgId), IsNull()) : undefined,
      },
      relations: ['role.rolePermissions.permission', 'organization'],
    });

    return assignments;
  }

  list(pagination: IPaginationOptions, search?: string): Promise<Role[]> {
    const { limit, page } = pagination;
    return this.roleRepository.find({
      where: search
        ? {
            name: Or(ILike(`%${search}%`)),
          }
        : undefined,
      take: limit,
      skip: page * limit,
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }
}
