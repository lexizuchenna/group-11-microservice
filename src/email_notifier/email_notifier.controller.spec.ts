import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotifierController } from './email_notifier.controller';

describe('EmailNotifierController', () => {
  let controller: EmailNotifierController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailNotifierController],
    }).compile();

    controller = module.get<EmailNotifierController>(EmailNotifierController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
