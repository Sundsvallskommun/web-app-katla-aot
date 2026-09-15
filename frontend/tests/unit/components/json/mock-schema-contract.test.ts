import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getFormSchemaValidator } from '@components/json/schema/form-schema-validator';
import { getConditionalFields } from '@components/json/utils/schema-conditions';
import { jsonWidgets } from '@components/json/widgets';
import type { RJSFSchema } from '@rjsf/utils';
import { attachmentTypesOfSchema } from '@utils/errand-attachments';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Contract test between the renderer and the schemas the BFF serves. The generator that once
 * refused to emit a broken pair is retired, so this is what stands between a schema edit and the
 * citizen. It runs against the mocked pairs in backend/src/mocks; once the schemas live in the
 * jsonschema service, point it at the published versions instead.
 */

const mocksDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../backend/src/mocks');

interface StoredSchema {
  name: string;
  version: string;
  value: RJSFSchema;
}

const schemaFiles = fs
  .readdirSync(mocksDir)
  .filter((file) => file.endsWith('.schema.json'))
  .sort();

const loadJson = (file: string): unknown => JSON.parse(fs.readFileSync(path.join(mocksDir, file), 'utf-8'));

const pairs = schemaFiles.map((file) => ({
  file,
  schema: loadJson(file) as StoredSchema,
  uiSchema: (loadJson(file.replace('.schema.json', '.ui-schema.json')) as { value: Record<string, unknown> }).value,
}));

const collectWidgetNames = (node: unknown, found: Set<string>): void => {
  if (typeof node !== 'object' || node === null) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'ui:widget' && typeof value === 'string') found.add(value);
    collectWidgetNames(value, found);
  }
};

const objectSchemas = (schema: RJSFSchema): RJSFSchema[] => {
  const collected: RJSFSchema[] = [schema];
  for (const child of Object.values(schema.properties ?? {})) {
    if (typeof child !== 'object' || child === null) continue;
    if (child.type === 'object') collected.push(...objectSchemas(child));
    if (
      child.type === 'array' &&
      typeof child.items === 'object' &&
      !Array.isArray(child.items) &&
      child.items.type === 'object'
    ) {
      collected.push(...objectSchemas(child.items));
    }
  }
  return collected;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mocked schema pairs against the renderer contract', () => {
  it('finds the mocked pairs', () => {
    expect(pairs.length).toBeGreaterThanOrEqual(10);
  });

  describe.each(pairs)('$file', ({ schema, uiSchema }) => {
    it('compiles with the real form validator', () => {
      const validator = getFormSchemaValidator(`${schema.name}_${schema.version}`);
      // A schema AJV cannot compile does not throw here — the failure surfaces as an error whose
      // stack carries the compile message instead of a field path.
      const result = validator.validateFormData({}, schema.value);
      expect(result.errors.filter((error) => error.stack.includes('no schema with key or ref'))).toEqual([]);
    });

    it('uses only widget names the registry resolves', () => {
      const used = new Set<string>();
      collectWidgetNames(uiSchema, used);
      for (const name of used) {
        expect(Object.keys(jsonWidgets), `unresolved widget '${name}'`).toContain(name);
      }
    });

    it('places every root property in exactly one section', () => {
      const sections = (uiSchema['ui:sections'] ?? []) as { id: string; fields: string[] }[];
      const sectioned = sections.flatMap((section) => section.fields);
      const propertyNames = Object.keys(schema.value.properties ?? {});

      expect(new Set(sectioned).size, 'a field appears in more than one section').toBe(sectioned.length);
      expect([...sectioned].sort(), 'sections and schema properties must partition each other').toEqual(
        [...propertyNames].sort()
      );
    });

    it('uses only condition keywords the renderer understands', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      for (const objectSchema of objectSchemas(schema.value)) getConditionalFields(objectSchema);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('declares only well-formed x-attachments entries', () => {
      const declared = (schema.value as Record<string, unknown>)['x-attachments'];
      if (!Array.isArray(declared)) return;
      // attachmentTypesOfSchema silently drops malformed entries; nothing may be dropped here.
      expect(attachmentTypesOfSchema(schema.value as Record<string, unknown>)).toHaveLength(declared.length);
    });
  });

  it('flags a schema declaring draft-07, proving the compile check bites', () => {
    const validator = getFormSchemaValidator('contract-test-draft-07');
    const draft07 = { $schema: 'http://json-schema.org/draft-07/schema#', type: 'object' } as RJSFSchema;
    const result = validator.validateFormData({}, draft07);
    expect(result.errors.some((error) => error.stack.includes('no schema with key or ref'))).toBe(true);
  });
});
