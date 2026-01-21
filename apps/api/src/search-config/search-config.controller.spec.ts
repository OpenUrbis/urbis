import { Test, TestingModule } from '@nestjs/testing';
import { SearchConfigController } from './search-config.controller';

describe('SearchConfigController', () => {
  let controller: SearchConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchConfigController],
    }).compile();

    controller = module.get<SearchConfigController>(SearchConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
