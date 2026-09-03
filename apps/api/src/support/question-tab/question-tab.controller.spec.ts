import { Test, TestingModule } from '@nestjs/testing';
import { QuestionTabController } from './question-tab.controller';
import { QuestionTabService } from './question-tab.service';
import { RoleService } from '../../role/role.service';
import { UserService } from '../../user/user.service';
import { OrganizationService } from '../../organization/organization.service';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

describe('QuestionTabController', () => {
  let controller: QuestionTabController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionTabController],
      providers: [
        { provide: QuestionTabService, useValue: {} },
        { provide: RoleService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: OrganizationService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        Reflector,
      ],
    }).compile();

    controller = module.get<QuestionTabController>(QuestionTabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
