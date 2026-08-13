import { DeviationInformation } from '@components/errand-sections/deviation-information.component';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import type { ErrandFormDTO } from '@interfaces/errand-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadFormSchemaForEntryMock, translateMock } = vi.hoisted(() => ({
  loadFormSchemaForEntryMock: vi.fn(),
  translateMock: vi.fn((key: string) => key),
}));

vi.mock('@components/json/utils/schema-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@components/json/utils/schema-utils')>();
  return {
    ...actual,
    loadFormSchemaForEntry: loadFormSchemaForEntryMock,
  };
});

vi.mock('@components/json/schema/schema-form.component', () => ({
  default: ({
    formData,
    onChange,
  }: {
    formData?: Record<string, unknown>;
    onChange?: (data: Record<string, unknown>) => void;
  }) => (
    <input
      aria-label="Plats"
      value={typeof formData?.location === 'string' ? formData.location : ''}
      onChange={(event) => {
        onChange?.({ location: event.currentTarget.value });
      }}
    />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: translateMock }),
}));

function TestForm() {
  const methods = useForm<ErrandFormDTO>({
    defaultValues: {
      status: 'DRAFT',
      errandFormData: [
        {
          schemaName: 'avvikelse-plats-handelse',
          schemaId: 'schema-v1',
          data: '{"location":""}',
        },
      ],
    },
  });

  return (
    <FormProvider {...methods}>
      <FormValidationProvider>
        <DeviationInformation />
      </FormValidationProvider>
    </FormProvider>
  );
}

describe('DeviationInformation schema stability', () => {
  beforeEach(() => {
    loadFormSchemaForEntryMock.mockReset().mockResolvedValue({
      schema: { type: 'object' },
      uiSchema: {},
      schemaId: 'schema-v1',
    });
    translateMock.mockClear();
  });

  it('keeps focus and loads the persisted schema only once while entering multiple characters', async () => {
    const user = userEvent.setup();
    render(<TestForm />);

    const input = await screen.findByRole('textbox', { name: 'Plats' });
    await user.click(input);
    await user.type(input, 'ABC');

    expect(input).toHaveValue('ABC');
    expect(input).toHaveFocus();
    expect(loadFormSchemaForEntryMock).toHaveBeenCalledTimes(1);
    expect(loadFormSchemaForEntryMock).toHaveBeenCalledWith('avvikelse-plats-handelse', 'schema-v1', translateMock);
  });
});
