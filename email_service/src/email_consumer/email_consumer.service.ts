import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import * as send_grid_mail from '@sendgrid/mail';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Redis from 'ioredis';


@Injectable()
export class email_consumer_service implements OnModuleInit {

  constructor(private readonly http_service: HttpService) {}

  private retry_interval = 60000 * 5  // five minutes
  private retry_counts = 0;
  private message_in_queque: {
    notification_id: string,
    subject: string,
    message: string,
    template_id: string,
    user_variables: {
      name?: string,
      username?: string
    },
    to?: string,
    email?: string
  } = {
    notification_id: "",
    subject: "",
    message: "",
    template_id: "",
    user_variables: {},
    to: ""
  };
  private url = process.env.RABBITMQ_SERVER;
  private conn: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private client: Redis;
  
  // Initializes send grid and rabbitMQ as service 
  async onModuleInit() {
    const send_grid_api = process.env.SENDGRID_API_KEY;
    if (!send_grid_api) return;

    send_grid_mail.setApiKey(send_grid_api);
    if (!this.url) return;

    this.client = new Redis(
      process.env.REDIS_SERVER || 
      'redis://localhost:6379'
    );

    this.conn = await amqplib.connect(this.url);
    this.channel = await this.conn.createChannel();
    await this.watch_email_queue();
  }

  /**
   * Continously checks email queue and
   * processes every message that arrives
   * in the queue
   */
  async watch_email_queue() {
    try {

      this.retry_counts += 1;  // track the number of retries

      if (this.channel === null) return;

      this.channel.consume('email.queue', async (sent_message) => {
        if (!sent_message) return;

        // Parse the sent JSON queue message
        this.message_in_queque = JSON
          .parse(sent_message.content.toString());

        // TODO: retrieve email message template fron the TEMPLATE API, then
        // verify the returned data and place it in cache (Redis), then
        // pass the returned data from the template in the place of the message body
        // send the email using the new method which sends email using sendgrid
        
        // Check if template is in local cache
        
        
        // if not talk to the template API
        
        if (!process.env.TEMPLATE_API) return;

        const response = await firstValueFrom(
          this.http_service.post(
            process.env.TEMPLATE_API,
            {
              subject: this.message_in_queque.subject,
              message: this.message_in_queque.message,
              template_id: this.message_in_queque.template_id
            }
          )
        )

        const {subject, message} = response.data;

        const send_grid_from_email = process.env.SENDGRID_FROM_EMAIL;
        if (!send_grid_from_email) return;

        const mail = {
          to: this.message_in_queque.email ||
            this.message_in_queque.to,
          subject,
          from: send_grid_from_email,
          text: message,
          html: `<p>${message}</p>`
        }

        await this.send_email(mail)

        // Acknowledge the message
        if (!this.channel) return;

        this.channel.publish(
          'notifications.direct',
          'update',
          Buffer.from(JSON.stringify({
            notification_id: this.message_in_queque.notification_id,
            status: 'sent'
          }))
        )

        this.channel.ack(sent_message);
      });

    } catch (error) {
      // retry on failures up to 3 times with exponential time, then backoff
      if (this.retry_counts >= 3) {
        // place the request in the failed queue (failed.queue)
        
        // place update status data {notification_id: ..., status: ...} in the update.queue
        const status_data = {
          notification_id: this.message_in_queque.notification_id,
          status: "failed"
        }
        if (!this.channel) return
        
        this.channel.publish(
          "notifications.direct",
          "failed",
          Buffer.from(JSON.stringify(status_data))
        )
      }
      setTimeout(
        () => this.watch_email_queue(), 
        this.retry_interval
      );
      this.retry_interval *= 2;
    }
  }

  /**
   * sends email using send grid
   * 
   * @param mail email data to be sent
   * @returns the client's response array.
   * Index 0 contains the response
   */
  async send_email(mail: send_grid_mail.MailDataRequired) {
    const transport = await send_grid_mail.send(mail);
    return transport;
  }

  /**
   * caches a template with TTL of 24 hours
   * 
   * @param template the actual data to cache
   * @returns the template data and it actual user data
   */
  async saveTemplate(template: {
    template_id: string;
    subject: string;
    message: string;
    message_data: Record<string, any>;
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
  async getTemplate(template_id: string) {
    const data = await this.client.get(`template:${template_id}`);
    return data ? JSON.parse(data) : null;
  }
}
