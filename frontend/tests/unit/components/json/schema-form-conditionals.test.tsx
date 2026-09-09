import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const SCHEMA_ID = 'conditionals-schema:1';

/** The shape the OpenE rules flatten into: a checkbox source revealing two dependent fields. */
const schema: RJSFSchema = {
  type: 'object',
  properties: {
    finansiering: {
      type: 'array',
      uniqueItems: true,
      title: 'Finansiering',
      items: { type: 'string', oneOf: [{ const: 'EGNA_MEDEL', title: 'Egna medel' }] },
    },
    egnaMedel: { type: 'string', title: 'Egna medel, belopp' },
    ovrigt: { type: 'string', title: 'Övrigt' },
  },
  allOf: [
    {
      if: { properties: { finansiering: { contains: { const: 'EGNA_MEDEL' } } }, required: ['finansiering'] },
      then: { required: ['egnaMedel'] },
    },
  ],
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  finansiering: { 'ui:widget': 'checkboxes' },
  egnaMedel: { 'ui:widget': 'TextWidget' },
  ovrigt: { 'ui:widget': 'TextWidget' },
};

/** Mirrors how the errand form drives SchemaForm: controlled data, updated from onChange. */
function ControlledForm({ onData }: { onData: (data: Record<string, unknown>) => void }) {
  const [data, setData] = useState<Record<string, unknown>>({ ovrigt: 'kvar' });

  return (
    <SchemaForm
      schemaId={SCHEMA_ID}
      schema={schema}
      uiSchema={uiSchema}
      formData={data}
      onChange={(next) => {
        setData(next);
        onData(next);
      }}
      hideSubmitButton
    />
  );
}

describe('SchemaForm conditional fields', () => {
  it('hides a dependent field until its condition is met, and clears its answer when it is not', async () => {
    const user = userEvent.setup();
    const onData = vi.fn();
    render(<ControlledForm onData={onData} />);

    // Unconditional fields render from the start; the dependent one does not.
    expect(screen.getByRole('textbox', { name: 'Övrigt' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Egna medel, belopp' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Egna medel' }));
    await screen.findByRole('textbox', { name: 'Egna medel, belopp' });

    // Re-queried rather than reused: each change re-renders the form and replaces the input node.
    await user.type(screen.getByRole('textbox', { name: 'Egna medel, belopp' }), '10000');
    expect(onData).toHaveBeenLastCalledWith(
      expect.objectContaining({ finansiering: ['EGNA_MEDEL'], egnaMedel: '10000' })
    );

    // Unticking hides the field again and drops what was typed into it.
    await user.click(screen.getByRole('checkbox', { name: 'Egna medel' }));

    expect(screen.queryByRole('textbox', { name: 'Egna medel, belopp' })).not.toBeInTheDocument();
    const [lastData] = onData.mock.lastCall as [Record<string, unknown>];
    expect(lastData).not.toHaveProperty('egnaMedel');
    expect(lastData.ovrigt).toBe('kvar');
  });
});
