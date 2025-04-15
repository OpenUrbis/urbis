import { Test, TestingModule } from '@nestjs/testing';
import { MapConfigController } from './map-config.controller';

describe('MapConfigController', () => {
  let controller: MapConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MapConfigController],
    }).compile();

    controller = module.get<MapConfigController>(MapConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
