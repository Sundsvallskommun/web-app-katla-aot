import { ErrandFormDTO } from '@interfaces/errand-form';
import type { RJSFSchema } from '@rjsf/utils';
import {
  answersOfErrand,
  attachmentTypesOfSchema,
  defaultAttachmentCategory,
  missingRequiredAttachments,
  requiredAttachmentTypes,
} from '@utils/errand-attachments';
import { describe, expect, it } from 'vitest';

/**
 * Shaped like a published schema's own declaration, covering all three condition forms the
 * schemas use: const, enum and array-contains.
 */
const schema = {
  type: 'object',
  properties: {},
  'x-attachments': [
    {
      key: 'laddaUppFullmakt',
      label: 'Fullmakt',
      requiredWhen: { properties: { arDuFirmatecknare: { const: 'NEJ' } }, required: ['arDuFirmatecknare'] },
    },
    {
      key: 'bifogaRegisterutdragFranSkatteverket',
      label: 'Registerutdrag från Skatteverket',
      description: 'Hämtas på verksamt.se.',
      requiredWhen: {
        properties: { foretagsform: { enum: ['AKTIEBOLAG', 'HANDELSBOLAG'] } },
        required: ['foretagsform'],
      },
    },
    {
      key: 'bifogaKontoutdrag',
      label: 'Kontoutdrag för egna medel',
      requiredWhen: {
        properties: { finansiering: { contains: { const: 'EGNA_MEDEL' } } },
        required: ['finansiering'],
      },
    },
    { key: 'bifogaPlanritning', label: 'Planritning' },
  ],
} as unknown as RJSFSchema;

const types = attachmentTypesOfSchema(schema);
const keysOf = (list: { key: string }[]) => list.map((type) => type.key);

const errand = (answers: Record<string, unknown>, attachments?: ErrandFormDTO['attachments']): ErrandFormDTO => ({
  errandFormData: [{ schemaName: 'aot_tasting', schemaId: 'id', data: JSON.stringify(answers) }],
  attachments,
});

describe('errand attachments', () => {
  it('reads the bilagor the schema declares', () => {
    expect(keysOf(types)).toEqual([
      'laddaUppFullmakt',
      'bifogaRegisterutdragFranSkatteverket',
      'bifogaKontoutdrag',
      'bifogaPlanritning',
    ]);
  });

  it('has no bilagor for a schema that declares none', () => {
    expect(attachmentTypesOfSchema({ type: 'object' })).toEqual([]);
    expect(attachmentTypesOfSchema(null)).toEqual([]);
  });

  // The schema is maintained in another system and reaches the citizen with no build step, so a
  // malformed entry must not take the whole Bilagor section down with it.
  it('skips a declared entry that is missing a key or label', () => {
    const partial = { 'x-attachments': [{ key: 'utanEtikett' }, { label: 'Utan nyckel' }, 'nonsense'] };

    expect(attachmentTypesOfSchema(partial as unknown as RJSFSchema)).toEqual([]);
  });

  it('requires nothing while the questions that decide it are unanswered', () => {
    expect(requiredAttachmentTypes(types, {})).toEqual([]);
  });

  it('requires the fullmakt only when the applicant is not a firmatecknare', () => {
    expect(keysOf(requiredAttachmentTypes(types, { arDuFirmatecknare: 'JA' }))).not.toContain('laddaUppFullmakt');
    expect(keysOf(requiredAttachmentTypes(types, { arDuFirmatecknare: 'NEJ' }))).toContain('laddaUppFullmakt');
  });

  it('reads an enum membership condition', () => {
    expect(keysOf(requiredAttachmentTypes(types, { foretagsform: 'AKTIEBOLAG' }))).toEqual([
      'bifogaRegisterutdragFranSkatteverket',
    ]);
    expect(requiredAttachmentTypes(types, { foretagsform: 'ENSKILD_FIRMA' })).toEqual([]);
  });

  it('reads an array-contains condition', () => {
    expect(keysOf(requiredAttachmentTypes(types, { finansiering: ['BANKLAN', 'EGNA_MEDEL'] }))).toEqual([
      'bifogaKontoutdrag',
    ]);
    expect(requiredAttachmentTypes(types, { finansiering: ['BANKLAN'] })).toEqual([]);
  });

  it('counts a required bilaga as delivered once a file carries its category', () => {
    const answers = { arDuFirmatecknare: 'NEJ' };
    expect(keysOf(missingRequiredAttachments(types, answers, undefined))).toEqual(['laddaUppFullmakt']);
    expect(
      missingRequiredAttachments(types, answers, [{ category: 'laddaUppFullmakt', fileName: 'fullmakt.pdf' }])
    ).toEqual([]);
  });

  it('a file of another category does not satisfy the requirement', () => {
    const missing = missingRequiredAttachments(types, { arDuFirmatecknare: 'NEJ' }, [
      { category: 'bifogaPlanritning', fileName: 'ritning.pdf' },
    ]);

    expect(keysOf(missing)).toEqual(['laddaUppFullmakt']);
  });

  it('tags a newly picked file as the first bilaga still missing', () => {
    expect(defaultAttachmentCategory(types, { foretagsform: 'AKTIEBOLAG' }, undefined)).toBe(
      'bifogaRegisterutdragFranSkatteverket'
    );
  });

  it('falls back to the first declared bilaga when nothing is required', () => {
    expect(defaultAttachmentCategory(types, {}, undefined)).toBe('laddaUppFullmakt');
  });

  it('reads the answers of the errand type being filled in', () => {
    expect(answersOfErrand(errand({ foretagsform: 'AKTIEBOLAG' }), 'aot_tasting')).toEqual({
      foretagsform: 'AKTIEBOLAG',
    });
    expect(answersOfErrand(errand({ foretagsform: 'AKTIEBOLAG' }), 'aot_farm_sales')).toEqual({});
  });
});
