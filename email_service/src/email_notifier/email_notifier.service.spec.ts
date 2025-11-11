import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotifierService } from './email_notifier.service';

describe('EmailNotifierService', () => {
  let service: EmailNotifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailNotifierService],
    }).compile();

    service = module.get<EmailNotifierService>(EmailNotifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
