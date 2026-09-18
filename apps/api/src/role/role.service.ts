import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';
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
import { User } from '../user/entities/user.entity';
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
    @Inject(forwardRef(() => OrganizationService))
    private readonly organizationService: OrganizationService,
    private readonly configService: ConfigService,
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

  async delete(
    id: string,
    organization?: Organization,
  ): Promise<{ message: string }> {
    const role = await this.findOne(id);

    if (organization && role.organizationId !== organization.id) {
      throw new NotFoundException({ message: 'Role is not found' });
    }

    if (
      role.isSystemRole ||
      Object.values(SYSTEM_ROLES).includes(role.id) ||
      !role.organizationId
    ) {
      throw new BadRequestException(
        'Cargos do sistema não podem ser excluídos',
      );
    }

    await this.userRoleAssignmentRepository.delete({ roleId: id });
    await this.roleRepository.softDelete(id);

    return { message: 'OK' };
  }

  async assign(
    data: AssignRoleDto,
    organization?: Organization,
    entityManager?: EntityManager,
  ) {
    const { userId, roleId, organizationId = organization?.id } = data;
    const systemOrgId = this.configService.get<string>('admin.organization.id');
    const role = await this.findOne(roleId);

    if (
      (roleId === SYSTEM_ROLES.user ||
        (role?.isSystemRole && role?.name === 'Usuário')) &&
      organizationId &&
      organizationId !== systemOrgId
    ) {
      throw new BadRequestException(
        'O cargo de Usuário não pode ser cadastrado em outras entidades que não a do sistema.',
      );
    }

    const repo = entityManager
      ? entityManager.getRepository(UserRoleAssignment)
      : this.userRoleAssignmentRepository;

    const assign = await repo.findOne({
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
      return repo.save(newRegister);
    else return assign;
  }

  async unassign(id: string, entityManager?: EntityManager) {
    const repo = entityManager
      ? entityManager.getRepository(UserRoleAssignment)
      : this.userRoleAssignmentRepository;

    const assign = await repo.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!assign) {
      return { message: 'OK' };
    }

    if (
      assign.roleId === SYSTEM_ROLES.user ||
      assign.role?.id === SYSTEM_ROLES.user
    ) {
      throw new BadRequestException(
        'O cargo de Usuário do sistema não pode ser removido do usuário',
      );
    }

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
      assigns
        .filter((assign) => assign.roleId !== SYSTEM_ROLES.user)
        .forEach((assign) =>
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

  async findUsersWithRole(
    organizationId: string,
    roleId: string,
  ): Promise<User[]> {
    const assignments = await this.userRoleAssignmentRepository.find({
      where: {
        organizationId,
        roleId,
      },
      relations: ['user'],
    });
    return assignments.map((a) => a.user);
  }

  async hasSystemRole(userId: string, roleId: string): Promise<boolean> {
    const count = await this.userRoleAssignmentRepository.count({
      where: {
        userId,
        roleId,
      },
    });
    return count > 0;
  }

  async hasOrganization(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const count = await this.userRoleAssignmentRepository.count({
      where: {
        userId,
        organizationId,
      },
    });
    return count > 0;
  }
}
