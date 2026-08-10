import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class OrgManagerDTO {
  @IsString()
  @IsOptional()
  personId?: string;

  @IsString()
  @IsOptional()
  givenname?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsString()
  @IsOptional()
  emailAddress?: string;
}

export class UserEmploymentDTO {
  @IsNumber()
  @IsOptional()
  orgId?: number;

  @IsString()
  @IsOptional()
  orgName?: string;

  @IsNumber()
  @IsOptional()
  topOrgId?: number;

  @IsBoolean()
  @IsOptional()
  isMainEmployment?: boolean;

  @ValidateNested()
  @Type(() => OrgManagerDTO)
  @IsOptional()
  manager?: OrgManagerDTO;
}

export class FacilityInfoDTO {
  @IsNumber()
  @IsOptional()
  orgId?: number;

  @IsString()
  @IsOptional()
  orgName?: string;

  @IsNumber()
  @IsOptional()
  parentOrgId?: number;

  @IsString()
  @IsOptional()
  parentOrgName?: string;

  @ValidateNested()
  @Type(() => OrgManagerDTO)
  @IsOptional()
  manager?: OrgManagerDTO;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsBoolean()
  @IsOptional()
  hasSubUnits?: boolean;
}
