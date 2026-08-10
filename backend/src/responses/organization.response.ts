import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class OrgTreeNodeDTO {
  @IsNumber()
  @IsOptional()
  orgId?: number;

  @IsString()
  @IsOptional()
  orgName?: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsBoolean()
  @IsOptional()
  isLeafLevel?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgTreeNodeDTO)
  @IsOptional()
  organizations?: OrgTreeNodeDTO[];
}

export class OrgLeafNodeDTO {
  @IsNumber()
  orgId!: number;

  @IsString()
  orgName!: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;
}
