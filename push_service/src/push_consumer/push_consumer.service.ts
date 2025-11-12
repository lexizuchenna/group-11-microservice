import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import * as admin from 'firebase-admin';

@Injectable()
export class push_consumer_service implements OnModuleInit {
  private retry_interval = 60000 * 5  // five minutes
  private retry_counts = 0;
  private message_in_queque: {
    notification_id: string,
    title: string,
    body: string,
    image?: string,
    link?: string,
    device_token: string
  } = {
    notification_id: "",
    title: "",
    body: "",
    image: "",
    link: "",
    device_token: ""
  };

  private url = process.env.RABBITMQ_SERVER;
  private conn: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private status_data: {
    notification_id: string,
    status: string
  } = {
    notification_id: "",
    status: ""
  }

  async onModuleInit() {
    // Initialize the SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    if (!this.url) throw new Error('Missing RabbitMQ URL');

    this.conn = await amqplib.connect(this.url);
    this.channel = await this.conn.createChannel();
    await this.watch_push_queue();
  }

  async watch_push_queue() {
    try {
      this.retry_counts += 1;

      if (!this.channel) throw new Error('Invalid queue channel');

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
          throw new Error(
            "Can't acknowledge queue due to unavailable queue channel"
          );

        this.channel.ack(sent_message);
      });
    } catch (error) {
      if (this.retry_counts >= 3) {
        this.status_data = {
          notification_id: this.message_in_queque.notification_id,
          status: 'failed',
        };

        if (!this.channel)
          throw new Error("Can't publish to failed queue due to unavailable queue channel");

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
      // console.error('Error sending push:', err);
      // Logging error
      throw err;
    }
  }
}
