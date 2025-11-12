import { Injectable } from '@nestjs/common';
import { 
  push_notifier_health_dto, 
  health_status 
} from './push_notifier.dto';
import * as amqplib from 'amqplib';

@Injectable()
export class push_notifier_service {
  async get_health_status(): Promise<push_notifier_health_dto> {
    const is_connected = await this.is_connected_to_queue();

    if (is_connected)
      return {
        success: true,
        data: {
          service_name: "push service",
          status: health_status.Up
        },
        message: "push service health",
        meta: {
          has_next: false,
          limit: 0,
          has_previous: false,
          page: 1,
          total: 1,
          total_pages:1
        }
      }
    
    return {
      success: false,
      error: "push service failed",
      message: "push service health",
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

  async is_connected_to_queue(): Promise<boolean> {
    try {
      const url = process.env.RABBITMQ_SERVER;
      if (!url) return false

      const conn = await amqplib.connect(url);
      const channel = await conn.createChannel();

      await channel.checkQueue('push.queue');

      await channel.close();
      await conn.close();
      return true;
    } catch (error) {
      return false;
    }
  }
}
