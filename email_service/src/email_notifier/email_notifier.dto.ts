import {
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';


export class pagination_meta_dto {
  @IsNumber()
  total: number;
  
  @IsNumber()
  limit: number;
  
  @IsNumber()
  page: number;
  
  @IsNumber()
  total_pages: number;
  
  @IsBoolean()
  has_next: boolean;
  
  @IsBoolean()
  has_previous: boolean;
}

export enum health_status {
  Up = 'up',
  Down = 'down',
  Degraded = 'degraded',
}

export class microservice_health_dto {
  @IsString()
  service_name: string;

  @IsEnum(health_status)
  status: health_status;

  @IsOptional()
  @IsNumber()
  uptime?: number;

  @IsOptional()
  @IsString()
  details?: string;
}

export class email_notifier_health_dto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => microservice_health_dto)
  data?: microservice_health_dto;

  @IsOptional()
  @IsString()
  error?: string;

  @IsString()
  message: string;

  @ValidateNested()
  @Type(() => pagination_meta_dto)
  meta: pagination_meta_dto;
}