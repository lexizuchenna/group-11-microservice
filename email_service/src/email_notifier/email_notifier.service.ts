import { Injectable } from '@nestjs/common';
import { email_notifier_health_dto, health_status } from './email_notifier.dto';
import * as amqplib from 'amqplib';


@Injectable()
export class email_notifier_service {
  async get_health_status(): Promise<email_notifier_health_dto> {
    const is_connected = await this.is_connected_to_queue();

    if (is_connected)
      return {
        success: true,
        data: {
          service_name: "email service",
          status: health_status.Up
        },
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
    
    return {
      success: false,
      error: "email service failed",
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

  async is_connected_to_queue(): Promise<boolean> {
    try {
      const url = process.env.RABBITMQ_SERVER;
      if (!url) return false

      const conn = await amqplib.connect(url);
      const channel = await conn.createChannel();

      await channel.checkQueue('email.queue');

      await channel.close();
      await conn.close();
      return true;
    } catch (error) {
      return false;
    }
  }
}
