import { Test, TestingModule } from '@nestjs/testing';
import { QuestionAnswerController } from './question-answer.controller';

describe('QuestionAnswerController', () => {
  let controller: QuestionAnswerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionAnswerController],
    }).compile();

    controller = module.get<QuestionAnswerController>(QuestionAnswerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
