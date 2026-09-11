import { IsOptional, IsString } from 'class-validator';

import { ErrandAttachment } from '@/data-contracts/supportmanagement/data-contracts';

export class ErrandAttachmentDTO implements ErrandAttachment {
  @IsString()
  id!: string;
  @IsString()
  fileName!: string;
  @IsOptional()
  @IsString()
  mimeType?: string;
  @IsOptional()
  @IsString()
  created?: string;
}

export class CreateErrandAttachmentDTO {
  /** The bilagetyp the citizen picked; one of the keys in the frontend's attachment catalogue. */
  @IsOptional()
  @IsString()
  category?: string;
}
