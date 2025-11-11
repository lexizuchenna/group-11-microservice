import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailNotifierModule } from './email_notifier/email_notifier.module';

@Module({
  imports: [EmailNotifierModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
