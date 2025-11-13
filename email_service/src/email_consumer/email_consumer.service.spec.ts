import { Test, TestingModule } from '@nestjs/testing';
import { email_consumer_service } from './email_consumer.service';

describe('EmailConsumerService', () => {
  let service: email_consumer_service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [email_consumer_service],
    }).compile();

    service = module.get<email_consumer_service>(email_consumer_service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
