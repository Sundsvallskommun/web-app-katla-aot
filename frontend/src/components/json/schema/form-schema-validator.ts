import { stripHtml } from '@components/json/widgets/types';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Ajv2020 from 'ajv/dist/2020';

class HtmlAwareAjv2020 extends Ajv2020 {
  constructor(options?: ConstructorParameters<typeof Ajv2020>[0]) {
    super(options);
    this.addHtmlAwareLengthKeyword('minLength', (length, limit) => length >= limit);
    this.addHtmlAwareLengthKeyword('maxLength', (length, limit) => length <= limit);
  }

  private addHtmlAwareLengthKeyword(
    keyword: 'minLength' | 'maxLength',
    comparator: (length: number, limit: number) => boolean
  ) {
    this.removeKeyword(keyword);
    this.addKeyword({
      keyword,
      type: 'string',
      schemaType: 'number',
      validate: (schema: number, data: string) => comparator(stripHtml(data || '').length, schema),
    });
  }
}

const validatorOptions = {
  ajvOptionsOverrides: {
    allErrors: true,
  },
  AjvClass: HtmlAwareAjv2020,
};

const createFormSchemaValidator = () => customizeValidator<Record<string, unknown>>(validatorOptions);
const createJsonValueSchemaValidator = () => customizeValidator<unknown>(validatorOptions);

type FormSchemaValidator = ReturnType<typeof createFormSchemaValidator>;
type JsonValueSchemaValidator = ReturnType<typeof createJsonValueSchemaValidator>;

const formSchemaValidators = new Map<string, FormSchemaValidator>();
const jsonValueSchemaValidators = new Map<string, JsonValueSchemaValidator>();

function requireSchemaId(schemaId: string): string {
  if (schemaId.trim().length === 0) {
    throw new Error('Cannot create a schema validator without an immutable schema ID');
  }
  return schemaId;
}

function getOrCreateValidator<T>(schemaId: string, validators: Map<string, T>, createValidator: () => T): T {
  const exactSchemaId = requireSchemaId(schemaId);
  const existingValidator = validators.get(exactSchemaId);
  if (existingValidator) return existingValidator;

  const validator = createValidator();
  validators.set(exactSchemaId, validator);
  return validator;
}

/**
 * AJV cachar kompilerade scheman på schemadokumentets `$id`. Katlas schema-ID är
 * den oföränderliga versionsidentiteten, så varje exakt Katla-ID äger sin egen
 * AJV-instans även när flera versioner avsiktligt delar samma `$id`.
 */
export function getFormSchemaValidator(schemaId: string): FormSchemaValidator {
  return getOrCreateValidator(schemaId, formSchemaValidators, createFormSchemaValidator);
}

// Persisterade JSON-parametrar kan ha vilken JSON-rottyp som helst, även om det interaktiva formuläret i dag äger objektrötter.
export function getJsonValueSchemaValidator(schemaId: string): JsonValueSchemaValidator {
  return getOrCreateValidator(schemaId, jsonValueSchemaValidators, createJsonValueSchemaValidator);
}
