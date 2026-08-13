import { getFormSchemaValidator } from '@components/json/schema/form-schema-validator';
import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const TIME_SCHEMA_ID = 'time-widget-schema:1';

function renderTimeField(schema: RJSFSchema, uiSchema: UiSchema<Record<string, unknown>> = {}) {
  const onChange = vi.fn();
  render(
    <SchemaForm
      schemaId={TIME_SCHEMA_ID}
      schema={schema}
      uiSchema={uiSchema}
      formData={{}}
      onChange={onChange}
      hideSubmitButton
    />
  );

  return { input: screen.getByLabelText('Tid'), onChange };
}

describe('SchemaForm time widget', () => {
  it('renderar ett tidsfält från designsystemet för format time', () => {
    const { input } = renderTimeField({
      type: 'object',
      properties: {
        discoveredTime: { type: 'string', format: 'time', title: 'Tid' },
      },
    });

    expect(input).toHaveAttribute('type', 'time');
    expect(input).toHaveClass('sk-form-input');
  });

  it('renderar samma fält när UI-schemat väljer widgeten', () => {
    const { input } = renderTimeField(
      {
        type: 'object',
        properties: {
          discoveredTime: { type: 'string', title: 'Tid' },
        },
      },
      { discoveredTime: { 'ui:widget': 'time' } }
    );

    expect(input).toHaveAttribute('type', 'time');
    expect(input).toHaveClass('sk-form-input');
  });

  it('kompletterar med sekunder bara när schemat kräver time-format', () => {
    const { input: timeFormatInput, onChange: onTimeFormatChange } = renderTimeField({
      type: 'object',
      properties: {
        discoveredTime: { type: 'string', format: 'time', title: 'Tid' },
      },
    });

    fireEvent.change(timeFormatInput, { target: { value: '12:11' } });
    expect(onTimeFormatChange).toHaveBeenLastCalledWith({ discoveredTime: '12:11:00' }, expect.anything());
  });

  it('behåller HH:mm för fält utan time-format', () => {
    const { input, onChange } = renderTimeField(
      {
        type: 'object',
        properties: {
          discoveredTime: { type: 'string', title: 'Tid' },
        },
      },
      { discoveredTime: { 'ui:widget': 'time' } }
    );

    fireEvent.change(input, { target: { value: '12:11' } });
    expect(onChange).toHaveBeenLastCalledWith({ discoveredTime: '12:11' }, expect.anything());
  });

  // Publicerat schema avvikelse-plats-handelse 1.3 deklarerar eventTime och occurredTime
  // som format: "time", och det formatet kräver sekunder. Utan påfyllnaden underkänns värdet.
  it('lämnar ett värde som validerar mot format time', () => {
    const schema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        eventTime: { type: 'string', format: 'time', title: 'Tid' },
      },
    };
    const validator = getFormSchemaValidator('time-format-contract:1');

    expect(validator.validateFormData({ eventTime: '17:05:00' }, schema).errors).toEqual([]);
    expect(validator.validateFormData({ eventTime: '17:05' }, schema).errors).not.toEqual([]);
    expect(validator.validateFormData({}, schema).errors).toEqual([]);
  });

  it('tömmer värdet i stället för att spara en tom sträng', () => {
    const { input, onChange } = renderTimeField(
      {
        type: 'object',
        properties: {
          discoveredTime: { type: 'string', title: 'Tid' },
        },
      },
      { discoveredTime: { 'ui:widget': 'time' } }
    );

    fireEvent.change(input, { target: { value: '12:11' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenLastCalledWith({}, expect.anything());
  });
});
