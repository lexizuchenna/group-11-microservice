import { Injectable } from '@nestjs/common';
import { email_notifier_health_dto } from './email_notifier.dto';

@Injectable()
export class email_notifier_service {
  getHealthStatus(): email_notifier_health_dto {
    // implement:
    // Testing connection to the email queque 
    // and the shared PostgreSQL
    // then return a data structure that 
    // meets up with the email_notifier_health_dto
    return {
      success: true,
      message: "email service health",
      meta: {
        has_next: false,
        limit: 0,
        has_previous: false,
        page: 1,
        total: 1,
        total_pages:1
      }
    }
  }
}
