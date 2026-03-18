import { Test, TestingModule } from '@nestjs/testing';
import { QuestionTabService } from './question-tab.service';

describe('QuestionTabService', () => {
  let service: QuestionTabService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionTabService],
    }).compile();

    service = module.get<QuestionTabService>(QuestionTabService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
