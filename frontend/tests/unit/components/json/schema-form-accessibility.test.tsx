import SchemaForm from '@components/json/schema/schema-form.component';
import type { LabelDTO } from '@data-contracts/backend/data-contracts';
import { descriptionId, errorId, type RJSFSchema, titleId, type UiSchema } from '@rjsf/utils';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { useMetadataStore } from 'src/stores/metadata-store';
import { afterEach, describe, expect, it, vi } from 'vitest';

type FormUiSchema = UiSchema<Record<string, unknown>>;
const ACCESSIBILITY_TEST_SCHEMA_ID = 'accessibility-test-schema:1';

// Platswidgeten bygger sökningen ur labelstrukturen och renderar bara en laddtext
// utan den, så testet måste seeda en struktur för att nå fältet alls.
const placeLabelStructure: LabelDTO[] = [
  {
    id: 'platsstruktur',
    classification: 'PLACE',
    displayName: 'Platsstruktur',
    resourceName: 'PLATSSTRUKTUR',
    resourcePath: 'PLATSSTRUKTUR',
    labels: [
      {
        id: 'vuxenutbildningen',
        classification: 'PLACE',
        displayName: 'IAF Vuxenutbildningen',
        resourceName: 'VUXENUTBILDNINGEN',
        resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN',
        labels: [
          {
            id: 'sfi',
            classification: 'PLACE',
            displayName: 'IAF VUX SFI SO och Grl',
            resourceName: 'SFI',
            resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI',
            labels: [
              {
                id: 'egen',
                classification: 'PLACE',
                displayName: 'IAF VUX SFI egen extern och SO',
                resourceName: 'EGEN',
                resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN',
                labels: [
                  {
                    id: 'solhaga',
                    classification: 'PLACE',
                    displayName: 'Solhaga',
                    resourceName: 'SOLHAGA',
                    resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/SOLHAGA',
                    labels: [
                      {
                        id: 'solhaga-bla',
                        classification: 'PLACE',
                        displayName: 'Blå',
                        resourceName: 'BLA',
                        resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/SOLHAGA/BLA',
                        labels: [],
                      },
                      {
                        id: 'solhaga-gul',
                        classification: 'PLACE',
                        displayName: 'Gul',
                        resourceName: 'GUL',
                        resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/SOLHAGA/GUL',
                        labels: [],
                      },
                    ],
                  },
                  {
                    id: 'skottsundsbacken',
                    classification: 'PLACE',
                    displayName: 'Skottsundsbacken',
                    resourceName: 'SKOTTSUNDSBACKEN',
                    resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/SKOTTSUNDSBACKEN',
                    labels: [
                      {
                        id: 'skottsundsbacken-bla',
                        classification: 'PLACE',
                        displayName: 'Blå',
                        resourceName: 'BLA',
                        resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/SKOTTSUNDSBACKEN/BLA',
                        labels: [],
                      },
                    ],
                  },
                  {
                    id: 'utan-avdelning',
                    classification: 'PLACE',
                    displayName: 'Anläggning utan avdelning',
                    resourceName: 'UTAN_AVDELNING',
                    resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/UTAN_AVDELNING',
                    labels: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

interface TextEditorStubProps {
  className?: string;
  name?: string;
  readOnly?: boolean;
}

vi.mock('next/dynamic', () => ({
  default: () => {
    const TextEditorStub: ComponentType<TextEditorStubProps> = ({ className, name, readOnly }) => (
      <div className={className} data-name={name}>
        <div className="ql-editor" contentEditable={!readOnly} />
      </div>
    );

    return TextEditorStub;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => {
      if (key === 'field_description.new_tab_announcement') return 'Öppnas i en ny flik';
      return typeof fallback === 'string' ? fallback : key;
    },
  }),
}));

vi.mock('@services/employee-service/employee-service', () => ({
  getUserEmployments: vi.fn().mockResolvedValue([]),
}));

vi.mock('@services/organization/organization-service', () => ({
  getOrgLeafNodes: vi.fn().mockResolvedValue([]),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  useMetadataStore.setState({ metadata: undefined });
});

describe('SchemaForm accessibility contract', () => {
  it('sanitizes external descriptions and connects label, description, required state and errors', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['summary'],
      properties: {
        summary: {
          type: 'string',
          title: 'Sammanfattning',
          minLength: 3,
          description: '<p>Schema description</p>',
        },
        details: {
          type: 'string',
          title: 'Detaljer',
          description: '<p>Trygg schematext</p><img src="x" onerror="alert(4)"><script>alert(5)</script>',
        },
      },
    };
    const uiSchema: FormUiSchema = {
      summary: {
        'ui:description':
          '<p>Trygg <strong>beskrivning</strong></p><img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">farlig länk</a><a href="https://example.com" target="_blank">trygg länk</a><a href="https://example.com/report" target="report">namngiven länk</a><a href="https://example.com/uppercase" target="_BLANK">versal länk</a>',
      },
    };

    render(
      <SchemaForm
        schemaId={ACCESSIBILITY_TEST_SCHEMA_ID}
        schema={schema}
        uiSchema={uiSchema}
        hideSubmitButton
        showValidation
      />
    );

    const input = screen.getByRole('textbox', { name: 'Sammanfattning' });
    const fieldId = input.id;
    const label = document.getElementById(titleId(fieldId));
    const description = document.getElementById(descriptionId(fieldId));

    expect(label).toHaveAttribute('for', fieldId);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(descriptionId(fieldId)));
    expect(description).toHaveTextContent('Trygg beskrivning');
    expect(description).toHaveTextContent('farlig länk');
    expect(description?.innerHTML).toContain('<strong>beskrivning</strong>');
    expect(description?.innerHTML).not.toMatch(/<script|onerror|javascript:/i);
    const externalLink = screen.getByRole('link', { name: 'trygg länk' });
    expect(externalLink).toHaveTextContent('trygg länk');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(externalLink).toHaveAccessibleDescription('Öppnas i en ny flik');

    const namedTargetLink = screen.getByRole('link', { name: 'namngiven länk' });
    expect(namedTargetLink).not.toHaveAttribute('target');
    expect(namedTargetLink).not.toHaveAttribute('rel');
    expect(namedTargetLink).not.toHaveAccessibleDescription();

    const differentlyCasedTargetLink = screen.getByRole('link', { name: 'versal länk' });
    expect(differentlyCasedTargetLink).not.toHaveAttribute('target');
    expect(differentlyCasedTargetLink).not.toHaveAttribute('rel');
    expect(differentlyCasedTargetLink).not.toHaveAccessibleDescription();

    const detailsInput = screen.getByRole('textbox', { name: 'Detaljer' });
    const schemaDescription = document.getElementById(descriptionId(detailsInput.id));
    expect(schemaDescription).toHaveTextContent('Trygg schematext');
    expect(schemaDescription?.innerHTML).not.toMatch(/script|onerror/i);

    fireEvent.change(input, { target: { value: 'x' } });

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(document.getElementById(errorId(fieldId))).toBeInTheDocument();
    });
  });

  it('gives a radio group a real accessible name, shared native group name and clickable option labels', async () => {
    const user = userEvent.setup();
    const schema: RJSFSchema = {
      type: 'object',
      required: ['eventType'],
      properties: {
        eventType: {
          type: 'string',
          title: 'Händelsetyp',
          description: 'Välj den typ som bäst beskriver händelsen.',
          enum: ['DEVIATION', 'MISCONDUCT'],
        },
      },
    };
    const uiSchema: FormUiSchema = {
      eventType: {
        'ui:widget': 'radio',
        'ui:enumNames': ['Avvikelse', 'Missförhållande'],
      },
    };

    render(<SchemaForm schemaId={ACCESSIBILITY_TEST_SCHEMA_ID} schema={schema} uiSchema={uiSchema} hideSubmitButton />);

    const group = screen.getByRole('group', { name: 'Händelsetyp' });
    const radios = screen.getAllByRole('radio');

    expect(group.tagName).toBe('FIELDSET');
    expect(within(group).getByText('Händelsetyp').tagName).toBe('LEGEND');
    expect(document.querySelector(`label[for="${group.id}"]`)).not.toBeInTheDocument();
    expect(group).toHaveAttribute('aria-describedby', expect.stringContaining(descriptionId(group.id)));
    expect(radios).toHaveLength(2);
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('name', group.id);
      expect(radio).toBeRequired();
    });

    await user.click(screen.getByText('Missförhållande'));
    const selectedRadio = screen.getByRole('radio', { name: 'Missförhållande' });
    expect(selectedRadio).toBeChecked();
    expect(selectedRadio).toHaveFocus();
  });

  it('sanitizes field descriptions during server rendering without a browser DOM', () => {
    vi.stubGlobal('DOMParser', undefined);
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          title: 'Sammanfattning',
          description: '<p>Servertext</p><a href="https://example.com" target="_blank">Dokumentation</a>',
        },
      },
    };

    expect(() =>
      renderToString(<SchemaForm schemaId={ACCESSIBILITY_TEST_SCHEMA_ID} schema={schema} hideSubmitButton />)
    ).not.toThrow();
  });

  it('keeps hidden labels as operable accessible names for native and rich text widgets', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        summary: { type: 'string', title: 'Dold sammanfattning' },
        notes: { type: 'string', title: 'Dold anteckning' },
      },
    };
    const uiSchema: FormUiSchema = {
      summary: { 'ui:options': { hideLabel: true } },
      notes: { 'ui:widget': 'texteditor', 'ui:options': { hideLabel: true } },
    };

    render(<SchemaForm schemaId={ACCESSIBILITY_TEST_SCHEMA_ID} schema={schema} uiSchema={uiSchema} hideSubmitButton />);

    const summary = screen.getByRole('textbox', { name: 'Dold sammanfattning' });
    const summaryLabel = document.querySelector<HTMLLabelElement>(`label[for="${summary.id}"]`);
    expect(summaryLabel).toHaveClass('sr-only');

    await waitFor(() => {
      const editor = screen.getByRole('textbox', { name: 'Dold anteckning' });
      expect(editor).toHaveAttribute('aria-labelledby', `${editor.id}__title`);
      expect(document.getElementById(`${editor.id}__title`)).toHaveClass('sr-only');
    });
  });

  it('lets the visible field label activate and focus the Quill editing surface', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        notes: { type: 'string', title: 'Anteckning' },
      },
    };
    const uiSchema: FormUiSchema = {
      notes: { 'ui:widget': 'texteditor' },
    };

    render(<SchemaForm schemaId={ACCESSIBILITY_TEST_SCHEMA_ID} schema={schema} uiSchema={uiSchema} hideSubmitButton />);

    const editor = await screen.findByRole('textbox', { name: 'Anteckning' });
    const label = document.querySelector<HTMLLabelElement>(`label[for="${editor.id}"]`);
    expect(label).toBeInTheDocument();
    label?.click();
    expect(editor).toHaveFocus();
  });

  it('prevents interaction in disabled and readonly checkbox, select and rich text widgets', async () => {
    const editableSchema: RJSFSchema = {
      type: 'object',
      properties: {
        consent: { type: 'boolean', title: 'Samtycke' },
        choice: { type: 'string', title: 'Val', enum: ['A', 'B'] },
        notes: { type: 'string', title: 'Anteckning' },
      },
    };
    const uiSchema: FormUiSchema = {
      choice: { 'ui:widget': 'select' },
      notes: { 'ui:widget': 'texteditor' },
    };

    const { unmount } = render(
      <SchemaForm
        schemaId={ACCESSIBILITY_TEST_SCHEMA_ID}
        schema={editableSchema}
        uiSchema={uiSchema}
        hideSubmitButton
        disabled
      />
    );

    expect(screen.getByRole('checkbox', { name: 'Samtycke' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Val' })).toBeDisabled();
    await waitFor(() => {
      const editor = screen.getByRole('textbox', { name: 'Anteckning' });
      expect(editor).toHaveAttribute('aria-disabled', 'true');
      expect(editor).toHaveAttribute('aria-readonly', 'true');
    });

    unmount();

    const readonlySchema: RJSFSchema = {
      ...editableSchema,
      properties: {
        consent: { type: 'boolean', title: 'Samtycke', readOnly: true },
        choice: { type: 'string', title: 'Val', enum: ['A', 'B'], readOnly: true },
        notes: { type: 'string', title: 'Anteckning', readOnly: true },
      },
    };

    render(
      <SchemaForm
        schemaId={ACCESSIBILITY_TEST_SCHEMA_ID}
        schema={readonlySchema}
        uiSchema={uiSchema}
        hideSubmitButton
      />
    );

    expect(screen.getByRole('checkbox', { name: 'Samtycke' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Val' })).toBeDisabled();
    await waitFor(() => {
      const editor = screen.getByRole('textbox', { name: 'Anteckning' });
      expect(editor).toHaveAttribute('aria-disabled', 'false');
      expect(editor).toHaveAttribute('aria-readonly', 'true');
    });
  });

  it('söker separat på anläggning, avdelning och överordnad nivå men visar bara nivå 6–7', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        facility: {
          type: 'object',
          title: 'Plats',
          description: 'Sök fram platsen där händelsen inträffade.',
          properties: {
            orgId: { type: 'number' },
            orgName: { type: 'string' },
            parentOrgName: { type: 'string' },
          },
        },
      },
    };
    const uiSchema: FormUiSchema = {
      facility: {
        'ui:field': 'FacilitySearchWidget',
      },
    };

    useMetadataStore.setState({ metadata: { labels: { labelStructure: placeLabelStructure } } });

    const user = userEvent.setup();
    render(<SchemaForm schemaId={ACCESSIBILITY_TEST_SCHEMA_ID} schema={schema} uiSchema={uiSchema} hideSubmitButton />);

    // i18n-mocken ekar nyckeln, så det är nyckeln som blir fältets tillgängliga namn här.
    const input = screen.getByRole('textbox', { name: 'facility_search.add_label' });
    const searchLabel = document.querySelector(`label[for="${input.id}"]`);

    expect(searchLabel).toHaveTextContent('facility_search.add_label');
    expect(input).toHaveAttribute('aria-labelledby', searchLabel?.id);
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(descriptionId(input.id)));
    const list = document.querySelector('.sk-form-combobox-list');
    expect(list).toHaveTextContent('Solhaga — facility_search.department_label: Blå');
    expect(list).toHaveTextContent('Skottsundsbacken — facility_search.department_label: Blå');
    expect(list).toHaveTextContent('Anläggning utan avdelning');
    expect(list).not.toHaveTextContent('IAF Vuxenutbildningen');

    await user.type(input, 'Blå');

    let visibleOptions = document.querySelectorAll('.sk-form-combobox-list-option');
    expect(visibleOptions).toHaveLength(2);
    expect(visibleOptions[0]).toHaveTextContent('Solhaga — facility_search.department_label: Blå');
    expect(visibleOptions[1]).toHaveTextContent('Skottsundsbacken — facility_search.department_label: Blå');

    await user.clear(input);
    await user.type(input, 'Solhaga');

    visibleOptions = document.querySelectorAll('.sk-form-combobox-list-option');
    expect(visibleOptions).toHaveLength(2);
    expect(visibleOptions[0]).toHaveTextContent('Solhaga — facility_search.department_label: Blå');
    expect(visibleOptions[1]).toHaveTextContent('Solhaga — facility_search.department_label: Gul');

    await user.clear(input);
    await user.type(input, 'SFI SO');

    visibleOptions = document.querySelectorAll('.sk-form-combobox-list-option');
    expect(visibleOptions).toHaveLength(4);
    expect(list).not.toHaveTextContent('IAF VUX SFI SO och Grl');
  });

  it('visar anläggning och avdelning med en enda åtgärd som öppnar platsväljaren igen', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        facility: {
          type: 'object',
          title: 'Plats',
          properties: {
            orgName: { type: 'string' },
            parentOrgName: { type: 'string' },
          },
        },
      },
    };
    const uiSchema: FormUiSchema = {
      facility: {
        'ui:field': 'FacilitySearchWidget',
      },
    };

    useMetadataStore.setState({ metadata: { labels: { labelStructure: placeLabelStructure } } });

    const user = userEvent.setup();
    render(
      <SchemaForm
        schemaId={ACCESSIBILITY_TEST_SCHEMA_ID}
        schema={schema}
        uiSchema={uiSchema}
        formData={{
          facility: {
            orgName: 'Blå',
            parentOrgName: 'Solhaga',
          },
        }}
        hideSubmitButton
      />
    );

    expect(document.querySelector('[data-cy="facility-name"]')).toHaveTextContent('Solhaga');
    expect(document.querySelector('[data-cy="facility-department"]')).toHaveTextContent(
      'facility_search.department_label: Blå'
    );
    expect(document.querySelector('[data-cy="facility-label-preview"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-cy="facility-confirm-button"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-cy="facility-remove-button"]')).not.toBeInTheDocument();

    const subPlaceOptions = document.querySelector('[data-cy="facility-sub-place-options"]');
    expect(subPlaceOptions).toBeInTheDocument();
    expect(within(subPlaceOptions as HTMLElement).getByRole('radio', { name: 'Blå' })).toBeChecked();
    expect(within(subPlaceOptions as HTMLElement).getByRole('radio', { name: 'Gul' })).not.toBeChecked();

    await user.click(within(subPlaceOptions as HTMLElement).getByRole('radio', { name: 'Gul' }));

    expect(document.querySelector('[data-cy="facility-department"]')).toHaveTextContent(
      'facility_search.department_label: Gul'
    );
    expect(document.querySelector('[data-cy="facility-sub-place-options"]')).toBeInTheDocument();

    const changeButton = screen.getByRole('button', { name: 'facility_search.change' });
    expect(changeButton).not.toHaveClass('flex-1');

    await user.click(changeButton);

    expect(await screen.findByRole('textbox', { name: 'facility_search.add_label' })).toBeInTheDocument();
  });

  it('visar bara anläggningen för ett val på nivå 6 utan avdelning', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        facility: {
          type: 'object',
          title: 'Plats',
          properties: {
            orgName: { type: 'string' },
            parentOrgName: { type: 'string' },
          },
        },
      },
    };
    const uiSchema: FormUiSchema = {
      facility: {
        'ui:field': 'FacilitySearchWidget',
      },
    };

    useMetadataStore.setState({ metadata: { labels: { labelStructure: placeLabelStructure } } });

    render(
      <SchemaForm
        schemaId={ACCESSIBILITY_TEST_SCHEMA_ID}
        schema={schema}
        uiSchema={uiSchema}
        formData={{
          facility: {
            orgName: 'Anläggning utan avdelning',
            parentOrgName: 'IAF VUX SFI egen extern och SO',
          },
        }}
        hideSubmitButton
      />
    );

    expect(document.querySelector('[data-cy="facility-name"]')).toHaveTextContent('Anläggning utan avdelning');
    expect(document.querySelector('[data-cy="facility-department"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-cy="facility-sub-place-options"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-cy="facility-label-preview"]')).not.toBeInTheDocument();
  });
});
