import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from 'common/mail/mail.service';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportService } from './support.service';

describe('SupportService', () => {
  let service: SupportService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMailService = {
    sendSupportTicket: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(SupportTicket),
          useValue: mockRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
