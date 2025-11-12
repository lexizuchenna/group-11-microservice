import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import * as send_grid_mail from '@sendgrid/mail';


@Injectable()
export class email_consumer_service implements OnModuleInit {

  private retry_interval = 60000 * 5  // five minutes
  private retry_counts = 0;
  private message_in_queque: {
    notification_id: string,
    subject: string,
    template_id: string,
    user_variables: {
      name?: string,
      username?: string
    },
    to: string
  } = {
    notification_id: "",
    subject: "",
    template_id: "",
    user_variables: {},
    to: ""
  };
  private url = process.env.RABBITMQ_SERVER;
  private conn: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  

  async onModuleInit() {
    const send_grid_api = process.env.SENDGRID_API_KEY;
    if (!send_grid_api) throw new Error('Missing SendGrid API');

    send_grid_mail.setApiKey(send_grid_api);
    if (!this.url) throw new Error('Missing RabbitMQ URL');

    this.conn = await amqplib.connect(this.url);
    this.channel = await this.conn.createChannel();
    await this.watch_email_queue();
  }

  async watch_email_queue() {
    try {

      this.retry_counts += 1;  // track the number of retries

      if (this.channel === null) throw new Error(
        "Invalid queue channel"
      )

      this.channel.consume('email.queue', async (sent_message) => {
        if (!sent_message) return;

        // Parse the sent JSON message
        const data = JSON.parse(sent_message.content.toString());
        this.message_in_queque = data

        // TODO: retrieve email message template fron the TEMPLATE API, then
        // verify the returned data and place in cache (Redis), then
        // pass the returned data from the template in the place of the message body
        // send the email using the new method whichsends email using sendgrid
        const send_grid_from_email = process.env.SENDGRID_FROM_EMAIL;
        if (!send_grid_from_email) throw new Error(
          "SENDGRID_FROM_EMAIL is missing"
        ) 
        const mail = {
          to: "email@fromusertemplate.com",
          subject: "subject from the template",
          from: send_grid_from_email,
          text: "message template from the template endpoint",
          html: "<p>message template from the template endpoint</p>"
        }
        await this.send_email(mail)

        // TODO: create the update status data {notification_id: ..., status: ...}
        // Then send it to update.queue

        // Acknowledge the message
        if (!this.channel) throw new Error(
          "Can't acknowledge queue due to unavailable queue channel"
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
        if (!this.channel) throw new Error(
          "Can't acknowledge queue due to unavailable queue channel"
        )
        
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

  // Create a method to send an email  using send grid api
  async send_email(mail: send_grid_mail.MailDataRequired) {
    const transport = await send_grid_mail.send(mail);
    return transport;
  }
}
