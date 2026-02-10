import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { OrganizationService } from 'organization/organization.service';
import {
  EntityManager,
  Equal,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Or,
  Repository,
} from 'typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { AddPermissionToRoleDto } from './dto/add-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleFromOrganizationDto } from './dto/update-role-from-organization.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { PermissionService } from './permission/permission.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepository: Repository<UserRoleAssignment>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,

    private readonly permissionService: PermissionService,
    @Inject({ forwardRef: () => OrganizationService })
    private readonly organizationService: OrganizationService,
  ) {}

  async findOne(id: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) throw new NotFoundException({ message: 'Role is not found' });

    return role;
  }

  async findDefault(organizationId?: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: {
        isDefault: true,
        organizationId: organizationId ? organizationId : IsNull(),
      },
    });
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
    const { permissions, name, description, organizationId, isDefault } =
      createRoleDto;

    if (isDefault && organizationId) {
      await this.roleRepository.update(
        { organization: { id: organizationId } },
        { isDefault: false },
      );
    }

    const role = this.roleRepository.create({ name, description, isDefault });
    if (organizationId) {
      role.organization = { id: organizationId } as Organization;
    }
    await this.roleRepository.save(role);

    if (permissions && permissions.length > 0) {
      await this.syncPermissions(role.id, permissions);
    }

    return this.findOne(role.id);
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
    organization?: Organization,
  ): Promise<Role> {
    const { permissions, ...roleData } = updateRoleDto;
    const role = await this.findOne(id);

    if (organization && role.organizationId !== organization.id) {
      throw new NotFoundException({ message: 'Role is not found' });
    }

    if (
      roleData.isDefault &&
      (roleData.organizationId || role.organizationId)
    ) {
      const orgId = roleData.organizationId || role.organizationId;
      await this.roleRepository.update(
        { organization: { id: orgId } },
        { isDefault: false },
      );
    }

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

  async assign(
    data: AssignRoleDto,
    organization?: Organization,
    entityManager?: EntityManager,
  ) {
    const { userId, roleId, organizationId = organization?.id } = data;
    const assign = await this.userRoleAssignmentRepository.findOne({
      where: {
        userId,
        roleId,
        organizationId,
      },
    });

    const newRegister = {
      userId,
      roleId,
      organizationId,
    };

    if (!assign)
      return entityManager
        ? entityManager.save(UserRoleAssignment, newRegister)
        : this.userRoleAssignmentRepository.save(newRegister);
    else return assign;
  }

  async unassign(id: string, entityManager?: EntityManager) {
    if (entityManager) await entityManager.delete(UserRoleAssignment, { id });
    else await this.userRoleAssignmentRepository.delete({ id });

    return { message: 'OK' };
  }

  async assignByOrganization(
    organizationId: string,
    data: UpdateRoleFromOrganizationDto,
  ) {
    const { roleIds, userId } = data;
    const organization = await this.organizationService.findOne(organizationId);

    return this.entityManager.transaction(async (manager) => {
      const assignPromises = [];
      roleIds.forEach((roleId) =>
        assignPromises.push(
          this.assign(
            { roleId, organizationId: organization.id, userId },
            organization,
            manager,
          ),
        ),
      );
      await Promise.all(assignPromises);

      return await this.userRoleAssignmentRepository.find({
        where: { organizationId, userId },
      });
    });
  }

  async updateAssignByOrganization(
    organizationId: string,
    data: UpdateRoleFromOrganizationDto,
  ) {
    const { roleIds, userId } = data;
    const organization = await this.organizationService.findOne(organizationId);
    const assigns = await this.userRoleAssignmentRepository.find({
      where: { organizationId, userId },
    });

    return this.entityManager.transaction(async (manager) => {
      const unassignPromises = [];
      assigns.forEach((assign) =>
        unassignPromises.push(this.unassign(assign.id, manager)),
      );
      await Promise.all(unassignPromises);

      const assignPromises = [];
      roleIds.forEach((roleId) =>
        assignPromises.push(
          this.assign(
            { roleId, organizationId: organization.id, userId },
            organization,
            manager,
          ),
        ),
      );
      await Promise.all(assignPromises);

      return await this.userRoleAssignmentRepository.find({
        where: { organizationId, userId },
      });
    });
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

  async list(
    pagination: IPaginationOptions,
    search?: string,
    exclude?: string[],
  ): Promise<{ data: Role[]; total: number }> {
    if (pagination.page > 0) pagination.page--;
    const { limit, page } = pagination;
    const where: FindOptionsWhere<Role> = {};

    if (search) where.name = Or(ILike(`%${search}%`));

    if (exclude && exclude?.length > 0) where.id = Not(In(exclude));

    const [data, total] = await this.roleRepository.findAndCount({
      where: where,
      take: limit,
      skip: page * limit,
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    return { data, total };
  }
}
