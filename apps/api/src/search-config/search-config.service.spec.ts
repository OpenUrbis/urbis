import { Test, TestingModule } from '@nestjs/testing';
import { SearchConfigService } from './search-config.service';

describe('SearchConfigService', () => {
  let service: SearchConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchConfigService],
    }).compile();

    service = module.get<SearchConfigService>(SearchConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
