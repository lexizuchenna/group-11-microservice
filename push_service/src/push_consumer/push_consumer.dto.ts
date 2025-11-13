import {
  IsString,
  IsOptional,
  ValidateNested,
  IsEmail,
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';


export class push_message_queue_dto {
  @IsString()
  notification_id: string;

  @IsString()
  type: "push";

  @IsEmail()
  to: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsString()
  template_id?: string;

  @IsString()
  priority: string;

  @IsString()
  device_token: string;

  @ValidateNested()
  @Type(() => additional_payload)
  data: additional_payload;

  @ValidateNested()
  @Type(() => event_and_timestamp)
  metadata: event_and_timestamp;
}

export class additional_payload {
  @IsString()
  message_id: string;

  @IsUrl()
  click_action: string;

  @IsString()
  sender: string;
}

export class event_and_timestamp {
  @IsString()
  event: string;

  @IsString()
  timestamp: string;
}