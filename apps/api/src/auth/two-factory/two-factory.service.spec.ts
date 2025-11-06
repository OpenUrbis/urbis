import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactoryService } from './two-factory.service';

describe('TwoFactoryService', () => {
  let service: TwoFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwoFactoryService],
    }).compile();

    service = module.get<TwoFactoryService>(TwoFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
