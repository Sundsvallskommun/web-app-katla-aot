import { Type as TypeTransformer } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  Category,
  ContactReason,
  ExternalIdType,
  Label,
  Labels,
  MetadataResponse,
  Role,
  Status,
  Type,
} from '@/data-contracts/supportmanagement/data-contracts';

export class TypeDTO implements Type {
  @IsString()
  name!: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  escalationEmail?: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class CategoryDTO implements Category {
  @IsString()
  @IsOptional()
  name?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => TypeDTO)
  types?: TypeDTO[];
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class ExternalIdTypeDTO implements ExternalIdType {
  @IsString()
  name!: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class LabelDTO implements Label {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  classification!: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  resourcePath?: string;
  @IsString()
  resourceName!: string;
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => LabelDTO)
  labels?: LabelDTO[];
}

export class LabelsDTO implements Labels {
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => LabelDTO)
  labelStructure?: LabelDTO[];
}

export class StatusDTO implements Status {
  @IsString()
  name!: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class RoleDTO implements Role {
  @IsString()
  name!: string;
  @IsString()
  @IsOptional()
  displayName?: string | null;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class ContactReasonDTO implements ContactReason {
  @IsString()
  @IsOptional()
  id?: number;
  @IsString()
  reason!: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class MetadataResponseDTO implements MetadataResponse {
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => CategoryDTO)
  categories?: CategoryDTO[];
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => ExternalIdTypeDTO)
  externalIdTypes?: ExternalIdTypeDTO[];
  @IsOptional()
  @ValidateNested()
  @TypeTransformer(() => LabelsDTO)
  labels?: Labels;
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => StatusDTO)
  statuses?: StatusDTO[];
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => RoleDTO)
  roles?: RoleDTO[];
  @IsOptional()
  @ValidateNested({ each: true })
  @TypeTransformer(() => ContactReasonDTO)
  contactReasons?: ContactReasonDTO[];
}
