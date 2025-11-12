import { Test, TestingModule } from '@nestjs/testing';
import { push_notifier_controller } from './push_notifier.controller';

describe('push_notifier_controller', () => {
  let controller: push_notifier_controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [push_notifier_controller],
    }).compile();

    controller = module.get<push_notifier_controller>(push_notifier_controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
