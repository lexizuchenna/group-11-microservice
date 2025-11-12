import { Module } from '@nestjs/common';
import { PushNotifierService } from './push_notifier.service';
import { PushNotifierController } from './push_notifier.controller';

@Module({
  providers: [PushNotifierService],
  controllers: [PushNotifierController]
})
export class push_notifier_module {}
