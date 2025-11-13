import { Test, TestingModule } from '@nestjs/testing';
import { push_consumer_service } from './push_consumer.service';

describe('push_consumer_service', () => {
  let service: push_consumer_service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [push_consumer_service],
    }).compile();

    service = module.get<push_consumer_service>(push_consumer_service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
