import { Module } from '@nestjs/common';
import { EmailNotifierService } from './email_notifier.service';
import { EmailNotifierController } from './email_notifier.controller';

@Module({
  providers: [EmailNotifierService],
  controllers: [EmailNotifierController]
})
export class EmailNotifierModule {}
