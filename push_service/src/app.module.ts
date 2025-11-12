import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';  // to load .env content
import { push_notifier_module } from './push_notifier/push_notifier.module';
import { push_consumer_module } from './push_consumer/push_consumer.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    push_notifier_module,
    push_consumer_module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
