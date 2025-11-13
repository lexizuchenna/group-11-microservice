import { Module } from '@nestjs/common';
import { email_consumer_service } from './email_consumer.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [email_consumer_service]
})
export class email_consumer_module {}
