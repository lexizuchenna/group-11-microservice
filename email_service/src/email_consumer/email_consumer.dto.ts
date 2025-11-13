import {
  IsString,
  IsOptional,
  ValidateNested,
  IsEmail,
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';


export class email_message_queue_dto {
  @IsString()
  notification_id: string;

  @IsString()
  type: "email";

  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsString()
  template_id?: string;

  @ValidateNested()
  @Type(() => template_dynamic_placeholder)
  data: template_dynamic_placeholder;

  @ValidateNested()
  @Type(() => event_and_timestamp)
  metadata: event_and_timestamp;
}

export class template_dynamic_placeholder {
  @IsString()
  username: string;

  @IsUrl()
  activation_link: string;
}

export class event_and_timestamp {
  @IsString()
  event: string;

  @IsString()
  timestamp: string;
}
