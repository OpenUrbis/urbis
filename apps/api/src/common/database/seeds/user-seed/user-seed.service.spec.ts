import { Test, TestingModule } from '@nestjs/testing';
import { UserSeedService } from './user-seed.service';

describe('UserSeedService', () => {
  let service: UserSeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSeedService],
    }).compile();

    service = module.get<UserSeedService>(UserSeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
