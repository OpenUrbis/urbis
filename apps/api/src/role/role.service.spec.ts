import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';
import { OrganizationService } from 'organization/organization.service';
import { EntityManager } from 'typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { PermissionService } from './permission/permission.service';
import { RoleService } from './role.service';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: any;
  let rolePermissionRepository: any;
  let userRoleAssignmentRepository: any;
  let organizationService: any;
  let permissionService: any;
  let entityManager: any;

  beforeEach(async () => {
    roleRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findAndCount: jest.fn(),
    };
    rolePermissionRepository = {
      delete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    userRoleAssignmentRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    organizationService = {
      findOne: jest.fn(),
    };
    permissionService = {
      findOne: jest.fn(),
    };
    entityManager = {
      transaction: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
      getRepository: jest.fn().mockReturnValue(userRoleAssignmentRepository),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepository,
        },
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: userRoleAssignmentRepository,
        },
        {
          provide: EntityManager,
          useValue: entityManager,
        },
        {
          provide: PermissionService,
          useValue: permissionService,
        },
        {
          provide: OrganizationService,
          useValue: organizationService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('unassign', () => {
    it('throws BadRequestException when trying to unassign system user role', async () => {
      userRoleAssignmentRepository.findOne.mockResolvedValue({
        id: 'assign-1',
        roleId: SYSTEM_ROLES.user,
        role: { id: SYSTEM_ROLES.user, name: 'Usuário' },
      });

      await expect(service.unassign('assign-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRoleAssignmentRepository.delete).not.toHaveBeenCalled();
    });

    it('unassigns normal role successfully', async () => {
      userRoleAssignmentRepository.findOne.mockResolvedValue({
        id: 'assign-2',
        roleId: 'custom-role-id',
        role: { id: 'custom-role-id', name: 'Custom Role' },
      });

      await expect(service.unassign('assign-2')).resolves.toEqual({
        message: 'OK',
      });
      expect(userRoleAssignmentRepository.delete).toHaveBeenCalledWith({
        id: 'assign-2',
      });
    });

    it('returns OK if assignment is not found', async () => {
      userRoleAssignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.unassign('missing-id')).resolves.toEqual({
        message: 'OK',
      });
      expect(userRoleAssignmentRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('prevents deleting system roles', async () => {
      roleRepository.findOne.mockResolvedValue({
        id: SYSTEM_ROLES.user,
        name: 'Usuário',
        isSystemRole: true,
      });

      await expect(service.delete(SYSTEM_ROLES.user)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
