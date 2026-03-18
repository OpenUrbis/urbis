import { Test, TestingModule } from '@nestjs/testing';
import { QuestionTabController } from './question-tab.controller';

describe('QuestionTabController', () => {
  let controller: QuestionTabController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionTabController],
    }).compile();

    controller = module.get<QuestionTabController>(QuestionTabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
