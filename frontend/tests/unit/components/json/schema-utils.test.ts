import type { ErrandFormDataItem } from '@interfaces/errand-form';
import type { RJSFSchema } from '@rjsf/utils';
import type { TFunction } from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ErrandFormDataContractError,
  errandFormDataToJsonParameters,
  jsonParametersToErrandFormData,
  loadFormSchema,
  loadFormSchemaById,
  upsertErrandFormDataItem,
  validateErrandFormData,
} from '../../../../src/components/json/utils/schema-utils';

const REQUIRED_SCHEMA_NAME = 'avvikelse-plats-handelse';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('validateErrandFormData', () => {
  it.each([undefined, []])('fails closed when required form data is missing', async (formDataEntries) => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateErrandFormData(formDataEntries)).resolves.toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when the required entry has no serialized data', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      validateErrandFormData([{ schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'schema-v1', data: '' }])
    ).resolves.toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when the requested schema definition is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ schemaId: 'missing-schema' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      validateErrandFormData([
        { schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'missing-schema', data: JSON.stringify({ location: 'A' }) },
      ])
    ).resolves.toHaveLength(1);
  });

  it('fails validation and serialization when a persisted entry omits schemaId without guessing latest', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const entries: ErrandFormDataItem[] = [
      { schemaName: REQUIRED_SCHEMA_NAME, data: JSON.stringify({ location: 'A' }) },
    ];

    await expect(validateErrandFormData(entries)).resolves.toEqual([expect.stringContaining('Missing schema ID')]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(() => errandFormDataToJsonParameters(entries)).toThrow(
      expect.objectContaining<Partial<ErrandFormDataContractError>>({ code: 'missing-schema-id' })
    );
  });

  it('fails loading a new form when the latest schema response omits schemaId', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          schema: {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
            properties: { location: { type: 'string' } },
            required: ['location'],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadFormSchema('new-schema-without-id')).rejects.toThrow(
      expect.objectContaining<Partial<ErrandFormDataContractError>>({ code: 'missing-schema-id' })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/schemas/latest/new-schema-without-id'),
      expect.anything()
    );
  });

  it('loads the exact persisted schemaId for an existing entry', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaId: 'schema-v1',
          schema: {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
            properties: { location: { type: 'string' } },
            required: ['location'],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      validateErrandFormData([
        { schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'schema-v1', data: JSON.stringify({ location: 'A' }) },
      ])
    ).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/schemas/schema-v1', {
      credentials: 'include',
    });
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/schemas/latest/'), expect.anything());
  });

  it('continues validating existing non-required schema entries', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url =
        typeof input === 'string' ? input
        : input instanceof URL ? input.href
        : input.url;
      const schemaId = url.split('/').at(-1);
      const schema =
        schemaId === 'optional-v1' ?
          {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            title: 'Optional schema',
            type: 'object',
            required: ['code'],
          }
        : {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
          };

      return Promise.resolve(
        new Response(JSON.stringify({ schema, schemaId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      validateErrandFormData([
        { schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'required-v1', data: '{}' },
        { schemaName: 'optional-schema', schemaId: 'optional-v1', data: '{}' },
      ])
    ).resolves.toEqual([expect.stringContaining('Optional schema')]);
  });

  it('validates array and scalar JSON roots against their persisted schemas', async () => {
    const schemas: Record<string, RJSFSchema> = {
      'required-object-v1': {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
      },
      'optional-array-v1': {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'array',
        items: { type: 'string' },
      },
      'optional-scalar-v1': {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'string',
      },
    };
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url =
        typeof input === 'string' ? input
        : input instanceof URL ? input.href
        : input.url;
      const schemaId = url.split('/').at(-1) ?? '';
      const schema = schemas[schemaId];
      return Promise.resolve(
        new Response(JSON.stringify({ schema, schemaId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      validateErrandFormData([
        { schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'required-object-v1', data: '{}' },
        { schemaName: 'optional-array', schemaId: 'optional-array-v1', data: '["A","B"]' },
        { schemaName: 'optional-scalar', schemaId: 'optional-scalar-v1', data: '"ready"' },
      ])
    ).resolves.toEqual([]);
  });

  it.each([
    ['missing response ID', undefined],
    ['mismatched response ID', 'different-schema-v1'],
  ])('fails closed when an exact schema has a %s', async (_case, responseSchemaId) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const requestedSchemaId = `requested-${_case.replaceAll(' ', '-')}`;
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          schema: { type: 'object' },
          ...(responseSchemaId === undefined ? {} : { schemaId: responseSchemaId }),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadFormSchemaById(requestedSchemaId)).rejects.toThrow(`Could not load schema: ${requestedSchemaId}`);
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:3001/api/schemas/${requestedSchemaId}`, {
      credentials: 'include',
    });
  });

  it('reports missing fields with the translated message and the field title from the schema', async () => {
    const schema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Plats och händelse',
      type: 'object',
      required: ['eventDate'],
      properties: {
        eventDate: { type: 'string', title: 'Datum för händelsen' },
      },
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ schema, schemaId: 'translated-error-v1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const translations: Record<string, string> = {
      'validation:required': 'Obligatoriskt fält',
    };
    const t = ((key: string, params?: Record<string, string>) =>
      key === 'form_field_error' ?
        `${params?.schemaTitle} – ${params?.fieldTitle}: ${params?.message}`
      : (translations[key] ?? key)) as unknown as TFunction;

    await expect(
      validateErrandFormData([{ schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'translated-error-v1', data: '{}' }], t)
    ).resolves.toEqual(['Plats och händelse – Datum för händelsen: Obligatoriskt fält']);
  });
});

describe('JSON parameter serialization', () => {
  it('throws a typed error instead of dropping data without a schemaId', () => {
    expect(() =>
      errandFormDataToJsonParameters([{ schemaName: 'uncached-schema', data: '{"preserve":true}' }])
    ).toThrow(expect.objectContaining<Partial<ErrandFormDataContractError>>({ code: 'missing-schema-id' }));
  });

  it('throws a typed error instead of replacing invalid persisted JSON', () => {
    expect(() =>
      errandFormDataToJsonParameters([
        { schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'schema-v1', data: '{invalid-json' },
      ])
    ).toThrow(expect.objectContaining<Partial<ErrandFormDataContractError>>({ code: 'invalid-json' }));
  });

  it('preserves valid non-object JSON values in both directions', () => {
    expect(
      errandFormDataToJsonParameters([
        { schemaName: 'array-schema', schemaId: 'array-v1', data: '["A","B"]' },
        { schemaName: 'nullable-schema', schemaId: 'nullable-v1', data: 'null' },
      ])
    ).toEqual([
      { key: 'array-schema', schemaId: 'array-v1', value: ['A', 'B'] },
      { key: 'nullable-schema', schemaId: 'nullable-v1', value: null },
    ]);

    expect(jsonParametersToErrandFormData([{ key: 'nullable-schema', schemaId: 'nullable-v1', value: null }])).toEqual([
      { schemaName: 'nullable-schema', schemaId: 'nullable-v1', data: 'null' },
    ]);
  });
});

describe('upsertErrandFormDataItem', () => {
  it('updates by schema name while preserving order, unrelated entries and the persisted schemaId', () => {
    const entries: ErrandFormDataItem[] = [
      { schemaName: 'other-before', schemaId: 'other-before-v1', data: '{"before":true}' },
      { schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'schema-v1', data: '{"location":"old"}' },
      { schemaName: 'other-after', schemaId: 'other-after-v1', data: '{"after":true}' },
    ];

    expect(
      upsertErrandFormDataItem(entries, {
        schemaName: REQUIRED_SCHEMA_NAME,
        schemaId: 'schema-v2',
        data: '{"location":"new"}',
      })
    ).toEqual([
      entries[0],
      { schemaName: REQUIRED_SCHEMA_NAME, schemaId: 'schema-v1', data: '{"location":"new"}' },
      entries[2],
    ]);
  });
});
