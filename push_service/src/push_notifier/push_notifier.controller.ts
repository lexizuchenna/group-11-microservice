import { Controller, Get } from '@nestjs/common';
import { push_notifier_service } from './push_notifier.service';

@Controller('pushes')
export class push_notifier_controller {
  constructor(
    private readonly push_service: push_notifier_service
  ) {}

  @Get('/status')
  async get_health() {
    return await this.push_service.get_health_status()
  }
}
