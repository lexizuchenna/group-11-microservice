import { Module } from '@nestjs/common';
import { push_consumer_service } from './push_consumer.service';

@Module({
  providers: [push_consumer_service]
})
export class push_consumer_module {}
