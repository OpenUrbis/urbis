import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactoryController } from './two-factory.controller';

describe('TwoFactoryController', () => {
  let controller: TwoFactoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwoFactoryController],
    }).compile();

    controller = module.get<TwoFactoryController>(TwoFactoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
