import { Test, TestingModule } from '@nestjs/testing';
import { QuestionAnswerService } from './question-answer.service';

describe('QuestionAnswerService', () => {
  let service: QuestionAnswerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionAnswerService],
    }).compile();

    service = module.get<QuestionAnswerService>(QuestionAnswerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
