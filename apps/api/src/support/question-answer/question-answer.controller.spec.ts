import { Test, TestingModule } from '@nestjs/testing';
import { QuestionAnswerController } from './question-answer.controller';
import { QuestionAnswerService } from './question-answer.service';
import { RoleService } from '../../role/role.service';
import { UserService } from '../../user/user.service';
import { OrganizationService } from '../../organization/organization.service';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

describe('QuestionAnswerController', () => {
  let controller: QuestionAnswerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionAnswerController],
      providers: [
        { provide: QuestionAnswerService, useValue: {} },
        { provide: RoleService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: OrganizationService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        Reflector,
      ],
    }).compile();

    controller = module.get<QuestionAnswerController>(QuestionAnswerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
