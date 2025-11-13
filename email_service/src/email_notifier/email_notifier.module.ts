import { Module } from '@nestjs/common';
import { email_notifier_service } from './email_notifier.service';
import { 
  email_notifier_controller 
} from './email_notifier.controller';

@Module({
  providers: [email_notifier_service],
  controllers: [email_notifier_controller]
})
export class email_notifier_module {}
