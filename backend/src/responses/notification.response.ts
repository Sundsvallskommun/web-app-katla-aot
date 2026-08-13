import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { Notification } from '@/data-contracts/supportmanagement/data-contracts';
import type ApiResponse from '@/interfaces/api-service.interface';

export class NotificationAcknowledgementResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data!: boolean;
  @IsString()
  message!: string;
}

export class NotificationDTO implements Notification {
  @IsOptional()
  @IsString()
  id?: string;
  @IsOptional()
  @IsString()
  created?: string;
  @IsOptional()
  @IsString()
  modified?: string;
  @IsOptional()
  @IsString()
  ownerFullName?: string;
  @IsOptional()
  @IsString()
  ownerId?: string;
  @IsOptional()
  @IsString()
  createdBy?: string;
  @IsOptional()
  @IsString()
  createdByFullName?: string;
  @IsOptional()
  @IsString()
  type?: string;
  @IsOptional()
  @IsString()
  subtype?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  content?: string;
  @IsOptional()
  @IsString()
  expires?: string;
  @IsOptional()
  @IsBoolean()
  globalAcknowledged?: boolean;
  @IsOptional()
  @IsBoolean()
  acknowledged?: boolean;
  @IsOptional()
  @IsString()
  errandId?: string;
  @IsOptional()
  @IsString()
  errandNumber?: string;
}
