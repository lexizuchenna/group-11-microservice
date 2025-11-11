import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { 
  email_notifier_module 
} from './email_notifier/email_notifier.module';
import { ConfigModule } from '@nestjs/config';  // to load .env content

@Module({
  imports: [
    ConfigModule.forRoot(),
    email_notifier_module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
