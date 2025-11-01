import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { Equal, ILike, IsNull, Or, Repository } from 'typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRolesDto } from './dto/user-roles.dto';
import { Role } from './entities/role.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { RoleTypeEnum } from './enums/role-type.enum';
import { PermissionService } from './permission/permission.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepository: Repository<UserRoleAssignment>,

    private readonly permissionService: PermissionService,
  ) {}

  async create(data: CreateRoleDto, organization: Organization) {
    const permissions = await this.permissionService.getFromArray(
      data.permissions,
    );

    return await this.roleRepository.save({
      ...(data as unknown as Role),
      permissions,
      organization,
    });
  }

  async update(id: string, data: UpdateRoleDto, organization: Organization) {
    const role = await this.roleRepository.findOne({
      where: { id, organizationId: organization.id, type: RoleTypeEnum.USER },
      relations: ['permissions'],
    });
    if (!role)
      throw new NotFoundException({ message: 'This role ID is not found' });

    const { name, description } = data;

    if (name !== undefined) role.name = name;

    if (description !== undefined) role.description = description;

    if (data.permissions !== undefined)
      role.permissions = await this.permissionService.getFromArray(
        data.permissions,
      );

    return await this.roleRepository.save(role);
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
      relations: ['role.permissions', 'organization'],
    });

    return assignments;
  }

  async getUserRoles(userId: string) {
    const assignments = await this.listUserRoles(userId);
    const roles: UserRolesDto[] = [];
    const systemRole: UserRolesDto = {
      type: RoleTypeEnum.SYSTEM,
      permissions: [],
    };

    assignments.forEach((assignment) => {
      if (assignment?.role?.type !== RoleTypeEnum.SYSTEM)
        roles.push({
          type: assignment.role.type,
          permissions: assignment.role.permissions.map(
            (permission) => permission.permission,
          ),
          organization: assignment?.organization?.id,
        });
      else
        systemRole.permissions.push(
          ...assignment.role.permissions.map(
            (permission) => permission.permission,
          ),
        );
    });

    roles.push(systemRole);

    return roles;
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
      relations: ['permissions'],
    });
  }
}
