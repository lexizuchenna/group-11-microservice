import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { 
  email_notifier_module 
} from './email_notifier/email_notifier.module';
import { ConfigModule } from '@nestjs/config';  // to load .env content
import { email_consumer_module } from './email_consumer/email_consumer.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    email_notifier_module,
    email_consumer_module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
