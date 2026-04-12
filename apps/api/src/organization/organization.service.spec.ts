import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { getRepositoryToken, getEntityManagerToken } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { RoleService } from '../role/role.service';

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {},
        },
        {
          provide: getEntityManagerToken(),
          useValue: {},
        },
        {
          provide: RoleService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
