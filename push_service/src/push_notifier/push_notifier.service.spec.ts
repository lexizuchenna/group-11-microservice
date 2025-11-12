import { Test, TestingModule } from '@nestjs/testing';
import { push_notifier_service } from './push_notifier.service';

describe('push_notifier_service', () => {
  let service: push_notifier_service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [push_notifier_service],
    }).compile();

    service = module.get<push_notifier_service>(push_notifier_service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
