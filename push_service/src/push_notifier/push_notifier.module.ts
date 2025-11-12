import { Module } from '@nestjs/common';
import { push_notifier_service } from './push_notifier.service';
import { push_notifier_controller } from './push_notifier.controller';

@Module({
  providers: [push_notifier_service],
  controllers: [push_notifier_controller]
})
export class push_notifier_module {}
