import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepository: Repository<UserRoleAssignment>,

    private readonly permissionService: PermissionService,
    @Inject({ forwardRef: () => OrganizationService })
    private readonly organizationService: OrganizationService,
  ) {}

  async findOne(id: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) throw new NotFoundException({ message: 'Role is not found' });

    return role;
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

  async assign(data: AssignRoleDto, entityManager?: EntityManager) {
    const { userId, roleId, organizationId } = data;
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

    const dataSource = this.userRoleAssignmentRepository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assignPromises = [];
      roleIds.forEach((roleId) =>
        assignPromises.push(
          this.assign({ roleId, organizationId: organization.id, userId }),
        ),
      );
      await Promise.all(assignPromises);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return await this.userRoleAssignmentRepository.find({
      where: { organizationId, userId },
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

    const dataSource = this.userRoleAssignmentRepository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const unassignPromises = [];
      assigns.forEach((assign) =>
        unassignPromises.push(this.unassign(assign.id)),
      );
      await Promise.all(unassignPromises);

      const assignPromises = [];
      roleIds.forEach((roleId) =>
        assignPromises.push(
          this.assign({ roleId, organizationId: organization.id, userId }),
        ),
      );
      await Promise.all(assignPromises);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return await this.userRoleAssignmentRepository.find({
      where: { organizationId, userId },
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

  list(
    pagination: IPaginationOptions,
    search?: string,
    exclude?: string[],
  ): Promise<Role[]> {
    const { limit, page } = pagination;
    const where: FindOptionsWhere<Role> = {};

    if (search) where.name = Or(ILike(`%${search}%`));

    if (exclude && exclude?.length > 0) where.id = Not(In(exclude));

    return this.roleRepository.find({
      where: where,
      take: limit,
      skip: page * limit,
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }
}
