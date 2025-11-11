import { Module } from '@nestjs/common';
import { email_consumer_service } from './email_consumer.service';

@Module({
  providers: [email_consumer_service]
})
export class email_consumer_module {}
