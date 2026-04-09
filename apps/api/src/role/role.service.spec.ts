import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { getRepositoryToken, getEntityManagerToken } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRoleAssignment } from './entities/user-role-assignment.entity';
import { PermissionService } from './permission/permission.service';
import { OrganizationService } from '../organization/organization.service';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: {},
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {},
        },
        {
          provide: getRepositoryToken(UserRoleAssignment),
          useValue: {},
        },
        {
          provide: getEntityManagerToken(),
          useValue: {},
        },
        {
          provide: PermissionService,
          useValue: {},
        },
        {
          provide: OrganizationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
