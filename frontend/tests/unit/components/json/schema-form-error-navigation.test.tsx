import SchemaForm from '@components/json/schema/schema-form.component';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { act, render, screen } from '@testing-library/react';
import { focusFirstInvalidField, INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

const translations: Record<string, string> = {
  section_incomplete: 'Ofullständig',
  section_complete: 'Komplett',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

const ERROR_NAVIGATION_SCHEMA_ID = 'error-navigation-schema:1';

const schema: RJSFSchema = {
  type: 'object',
  required: ['eventDate', 'description'],
  properties: {
    eventDate: { type: 'string', title: 'Datum för händelsen' },
    description: { type: 'string', title: 'Beskrivning' },
  },
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  'ui:sections': [
    { id: 'event', title: 'Om händelsen', fields: ['eventDate'], defaultOpen: false },
    { id: 'details', title: 'Beskrivning', fields: ['description'], defaultOpen: false },
  ],
};

function ErrorNavigationForm({
  showValidation,
  formData,
}: {
  showValidation?: boolean;
  formData?: Record<string, unknown>;
}) {
  const methods = useForm({ defaultValues: { status: 'DRAFT' } });

  return (
    <FormProvider {...methods}>
      <SchemaForm
        schemaId={ERROR_NAVIGATION_SCHEMA_ID}
        schema={schema}
        uiSchema={uiSchema}
        hideSubmitButton
        showValidation={showValidation}
        formData={formData}
      />
    </FormProvider>
  );
}

describe('felnavigering i schemaformuläret', () => {
  it('håller avsnitten omärkta tills valideringen är igång', () => {
    render(<ErrorNavigationForm />);

    expect(document.querySelector(`[${INVALID_FIELD_ATTRIBUTE}]`)).not.toBeInTheDocument();
    expect(screen.queryByText('Ofullständig')).not.toBeInTheDocument();
    expect(screen.queryByText('Komplett')).not.toBeInTheDocument();
  });

  it('märker ifyllda avsnitt som kompletta och avsnitt med fel som ofullständiga', () => {
    render(<ErrorNavigationForm showValidation formData={{ eventDate: '2026-08-13' }} />);

    expect(document.querySelector('[data-cy="section-status-event"]')).toHaveTextContent('Komplett');
    expect(document.querySelector('[data-cy="section-status-details"]')).toHaveTextContent('Ofullständig');
  });

  it('öppnar avsnittet och flyttar fokus till första fältet som saknas', () => {
    render(<ErrorNavigationForm showValidation />);

    // Fälten i ett hopfällt avsnitt är dolda för tillgänglighetsträdet, så de hämtas via id.
    const dateInput = document.getElementById('root_eventDate');
    const markedFields = document.querySelectorAll(`[${INVALID_FIELD_ATTRIBUTE}]`);
    expect(markedFields).toHaveLength(2);
    expect(markedFields[0].getAttribute(INVALID_FIELD_ATTRIBUTE)).toBe('root_eventDate');
    expect(screen.getAllByText('Ofullständig')).toHaveLength(2);

    const eventSection = document.querySelector('[data-cy="section-status-event"]')?.closest('[data-open]');
    expect(eventSection).toHaveAttribute('data-open', 'false');

    let navigated = false;
    act(() => {
      navigated = focusFirstInvalidField();
    });

    expect(navigated).toBe(true);
    expect(eventSection).toHaveAttribute('data-open', 'true');
    expect(dateInput).toHaveFocus();
  });
});
