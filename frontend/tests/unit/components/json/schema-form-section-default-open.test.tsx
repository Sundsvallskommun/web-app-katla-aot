import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    description: { type: 'string', title: 'Beskrivning' },
  },
};

const uiSchemaWith = (defaultOpen?: boolean): UiSchema<Record<string, unknown>> => ({
  'ui:sections': [
    {
      id: 'event-information',
      title: 'Information om händelsen',
      fields: ['description'],
      ...(defaultOpen === undefined ? {} : { defaultOpen }),
    },
  ],
});

function SectionForm({ defaultOpen, schemaId }: { defaultOpen?: boolean; schemaId: string }) {
  const methods = useForm({ defaultValues: { status: 'DRAFT' } });

  return (
    <FormProvider {...methods}>
      <SchemaForm schemaId={schemaId} schema={schema} uiSchema={uiSchemaWith(defaultOpen)} hideSubmitButton />
    </FormProvider>
  );
}

/**
 * Sektionerna ska vara öppna om inget annat sägs, samma standard som ErrandDisclosure
 * använder för de handkodade avsnitten. Innan den här ändringen var standarden den
 * omvända, vilket gjorde att ett ui-schema utan defaultOpen gav stängda sektioner i
 * Ärendeuppgifter men öppna i Grundinformation.
 */
describe('SchemaForm section default open state', () => {
  it('opens a section when the UI schema does not say otherwise', () => {
    render(<SectionForm schemaId="default-open-schema:1" />);

    expect(screen.getByRole('textbox', { name: /Beskrivning/ })).toBeVisible();
  });

  it('still honours an explicit defaultOpen:false', () => {
    render(<SectionForm schemaId="explicitly-closed-schema:1" defaultOpen={false} />);

    // En stängd sektion avmonterar sitt innehåll i stället för att dölja det.
    expect(screen.queryByRole('textbox', { name: /Beskrivning/ })).not.toBeInTheDocument();
  });

  it('keeps the section heading reachable in both states', () => {
    const { unmount } = render(<SectionForm schemaId="heading-open-schema:1" />);
    expect(screen.getByText('Information om händelsen')).toBeInTheDocument();
    unmount();

    render(<SectionForm schemaId="heading-closed-schema:1" defaultOpen={false} />);
    expect(screen.getByText('Information om händelsen')).toBeInTheDocument();
  });
});
