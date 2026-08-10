import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import type { TFunction } from 'i18next';

interface LimitParams {
  limit: number;
}
interface FormatParams {
  format: string;
}

const hasLimit = (e: RJSFValidationError): e is Omit<RJSFValidationError, 'params'> & { params: LimitParams } => {
  const p = e.params as unknown;
  return !!p && typeof (p as LimitParams).limit === 'number';
};

const hasFormat = (e: RJSFValidationError): e is Omit<RJSFValidationError, 'params'> & { params: FormatParams } => {
  const p = e.params as unknown;
  return !!p && typeof (p as FormatParams).format === 'string';
};

// Mapping from error name to translation key for limit-based errors
const limitErrorMap: Record<string, string> = {
  minItems: 'min_items',
  maxItems: 'max_items',
  minimum: 'minimum',
  maximum: 'maximum',
};

// Mapping from format type to translation key
const formatMap: Record<string, string> = {
  email: 'email',
  uri: 'url',
  url: 'url',
  date: 'date',
  'date-time': 'date_time',
};

// Get limit from schema based on property path
function getLimitFromSchema(
  schema: RJSFSchema,
  property: string,
  keyword: 'minLength' | 'maxLength'
): number | undefined {
  const props = schema.properties as Record<string, RJSFSchema> | undefined;
  if (!props) return undefined;
  const propSchema = props[property];
  if (!propSchema) return undefined;
  return propSchema[keyword];
}

export function createJsonErrorTransformer(schema: RJSFSchema, t: TFunction) {
  return (errors: RJSFValidationError[]): RJSFValidationError[] =>
    errors.map((e) => {
      if (e.name === 'required') {
        return { ...e, message: t('required') };
      }

      // Handle minLength/maxLength - both standard AJV and custom keyword
      if (e.name === 'minLength' || e.name === 'maxLength' || e.message?.includes(`"${e.name}"`)) {
        const keyword = e.name as 'minLength' | 'maxLength';
        const limit =
          hasLimit(e) ? e.params.limit : getLimitFromSchema(schema, e.property?.replace('.', '') ?? '', keyword);
        if (limit !== undefined) {
          const translationKey = keyword === 'minLength' ? 'min_length' : 'max_length';
          return { ...e, message: t(translationKey, { limit }) };
        }
      }

      // Handle other limit-based errors using lookup table
      const limitTranslationKey = limitErrorMap[e.name ?? ''];
      if (limitTranslationKey && hasLimit(e)) {
        return { ...e, message: t(limitTranslationKey, { limit: e.params.limit }) };
      }

      if (e.name === 'pattern') {
        return { ...e, message: t('pattern') };
      }

      if (e.name === 'format' && hasFormat(e)) {
        const translationKey = formatMap[e.params.format];
        return {
          ...e,
          message: t(translationKey || 'format', translationKey ? undefined : { format: e.params.format }),
        };
      }

      if (e.name === 'enum' || e.name === 'not') {
        return { ...e, message: t('required') };
      }

      // Handle const errors (e.g. checkbox that must be true)
      if (e.name === 'const') {
        return { ...e, message: t('checkbox_required') };
      }

      return e;
    });
}

export default createJsonErrorTransformer;
