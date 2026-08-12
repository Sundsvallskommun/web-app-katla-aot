import { IsObject, IsString } from 'class-validator';

export class SchemaResponseDTO {
  @IsObject()
  schema!: Record<string, unknown>;

  @IsObject()
  uiSchema!: Record<string, unknown>;

  @IsString()
  schemaId!: string;
}
