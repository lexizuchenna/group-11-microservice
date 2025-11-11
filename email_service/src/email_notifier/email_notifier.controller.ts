import { Controller, Get } from '@nestjs/common';
import { email_notifier_service } from './email_notifier.service';

@Controller('emails')
export class email_notifier_controller {
  constructor(
    private readonly email_service: email_notifier_service
  ) {}

  @Get('/status')
  async get_health() {
    return await this.email_service.get_health_status()
  }
}
