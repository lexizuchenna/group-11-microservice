import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import * as admin from 'firebase-admin';
import { push_message_queue_dto } from './push_consumer.dto';
import Redis from 'ioredis';

@Injectable()
export class push_consumer_service implements OnModuleInit {
  private retry_interval = 60000 * 5  // five minutes
  private retry_counts = 0;
  private message_in_queque: push_message_queue_dto = {
    notification_id: "",
    title: "",
    body: "",
    type: "push",
    priority: "",
    device_token: "",
    data: {
      message_id: "",
      click_action: "",
      sender:""
    },
    metadata: {
      event: "",
      timestamp: ""
    },
    to: ""
  };

  private url = process.env.RABBITMQ_SERVER;
  private conn: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private client: Redis;
  private status_data: {
    notification_id: string,
    status: string
  } = {
    notification_id: "",
    status: ""
  }

  async onModuleInit() {
    // Initialize the SDK
    this.client = new Redis(
      process.env.REDIS_SERVER || 
      'redis://localhost:6379'
    );
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    if (!this.url) return;

    this.conn = await amqplib.connect(this.url);
    this.channel = await this.conn.createChannel();
    await this.watch_push_queue();
  }

  async watch_push_queue() {
    try {
      this.retry_counts += 1;

      if (!this.channel) return;

      this.channel.consume('push.queue', async (sent_message) => {
        if (!sent_message) return;

        const data = JSON.parse(sent_message.content.toString());
        this.message_in_queque = data;

        const message = {
          token: data.device_token,
          notification: {
            title: data.title,
            body: data.body,
            imageUrl: data.image || undefined,
          },
          webpush: data.link
            ? {
                fcmOptions: {
                  link: data.link,
                },
              }
            : undefined,
        };

        await this.send_push_notification(message);

        // Update the shared store with the API Gateway
        this.status_data = {
          notification_id: this.message_in_queque
            .notification_id,
          status: 'sent'
        }
        
        this.channel?.publish(
          'notifications.direct', 
          'update', 
          Buffer.from(JSON.stringify(this.status_data))
        );

        if (!this.channel)
          return;

        this.channel.ack(sent_message);
      });
    } catch (error) {
      if (this.retry_counts >= 3) {
        this.status_data = {
          notification_id: this.message_in_queque.notification_id,
          status: 'failed',
        };

        if (!this.channel)
          return;

        this.channel.publish(
          'notifications.direct',
          'failed',
          Buffer.from(JSON.stringify(this.status_data)),
        );
      }

      setTimeout(() => this.watch_push_queue(), this.retry_interval);
      this.retry_interval *= 2;
    }
  }

  async send_push_notification(message: admin.messaging.Message) {
    try {
      const response = await admin.messaging().send(message);
      return response;
    } catch (err) {
      return;
    }
  }

  /**
   * caches a template with TTL of 24 hours
   * 
   * @param template the actual data to cache
   * @returns the template data and it actual user data
   */
  async save_template(template: {
    template_id: string;
    subject: string;
    message: string;
    data: Record<string, any>;
  }) {
    const key = `template:${template.template_id}`;
    const ttl = 24 * 60 * 60; // 24 hours in seconds
    await this.client
      .set(key, JSON.stringify(template), 'EX', ttl);
    // log this
  }

  /**
   * retrieves a template by an id
   * 
   * @param template_id an id of the tenplate to retrieve
   * @returns the actual template data or null if not found
   */
  async get_template(template_id: string) {
    const data = await this.client.get(`template:${template_id}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * 
   */
  parse_cache_template(template: {
    template_id: string;
    subject: string;
    message: string;
    data: Record<string, any>;
  }, current_data: Record<string, any>) {
    let transformed_message: string = "";
    for (const key in template.data) {
      transformed_message = template.message
        .replace(template.data[key], current_data[key]);
    }
    return transformed_message;
  }
}
