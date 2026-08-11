import { Test, TestingModule } from '@nestjs/testing';
import { GoogleRecaptchaGuard } from '@nestlab/google-recaptcha';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

describe('SupportController', () => {
  let controller: SupportController;
  let module: TestingModule;

  const mockSupportService = {
    createTicket: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: mockSupportService,
        },
      ],
    })
      .overrideGuard(GoogleRecaptchaGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SupportController>(SupportController);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
