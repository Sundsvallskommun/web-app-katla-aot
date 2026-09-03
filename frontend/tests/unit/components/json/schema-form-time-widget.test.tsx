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
  it('renders a design system time field for format time', () => {
    const { input } = renderTimeField({
      type: 'object',
      properties: {
        discoveredTime: { type: 'string', format: 'time', title: 'Tid' },
      },
    });

    expect(input).toHaveAttribute('type', 'time');
    expect(input).toHaveClass('sk-form-input');
  });

  it('renders the same field when the UI schema picks the widget', () => {
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

  it('pads with seconds only when the schema requires the time format', () => {
    const { input: timeFormatInput, onChange: onTimeFormatChange } = renderTimeField({
      type: 'object',
      properties: {
        discoveredTime: { type: 'string', format: 'time', title: 'Tid' },
      },
    });

    fireEvent.change(timeFormatInput, { target: { value: '12:11' } });
    expect(onTimeFormatChange).toHaveBeenLastCalledWith({ discoveredTime: '12:11:00' }, expect.anything());
  });

  it('keeps HH:mm for fields without the time format', () => {
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

  // A published schema declares eventTime and occurredTime as format: "time", and that format
  // requires seconds. Without padding them the value fails validation.
  it('yields a value that validates against format time', () => {
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

  it('clears the value instead of storing an empty string', () => {
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
