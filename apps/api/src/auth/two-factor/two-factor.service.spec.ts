import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import { UserService } from '../../user/user.service';
import { MailService } from '../../common/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: MailService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
