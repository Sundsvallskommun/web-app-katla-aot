import SchemaForm from '@components/json/schema/schema-form.component';
import type { LabelDTO, UserEmploymentDTO } from '@data-contracts/backend/data-contracts';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMetadataStore } from 'src/stores/metadata-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const employmentsMock = vi.hoisted(() => vi.fn());

vi.mock('@services/employee-service/employee-service', () => ({
  getUserEmployments: employmentsMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** Platsvalet måste peka på en nod som finns i strukturen — den styr behörigheten till ärendet. */
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
                    id: 'utan-avdelning',
                    classification: 'PLACE',
                    displayName: 'Anläggning utan avdelning',
                    resourceName: 'UTAN_AVDELNING',
                    resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/UTAN_AVDELNING',
                    labels: [],
                  },
                  {
                    id: 'annan-anlaggning',
                    classification: 'PLACE',
                    displayName: 'Annan anläggning',
                    resourceName: 'ANNAN_ANLAGGNING',
                    resourcePath: 'PLATSSTRUKTUR/VUXENUTBILDNINGEN/SFI/EGEN/ANNAN_ANLAGGNING',
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

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    facility: {
      type: 'object',
      title: 'Plats',
      properties: {
        orgId: { type: 'number' },
        orgName: { type: 'string' },
        parentOrgName: { type: 'string' },
      },
    },
  },
};

const uiSchema: UiSchema<Record<string, unknown>> = {
  facility: { 'ui:field': 'FacilitySearchWidget' },
};

/** Enhetstesterna i projektet queryar data-cy direkt; testing-library är inte omkonfigurerad. */
const cy = (name: string) => document.querySelector(`[data-cy="${name}"]`);
const findCy = async (name: string) => {
  await waitFor(() => {
    expect(cy(name)).toBeInTheDocument();
  });
  return cy(name) as HTMLElement;
};

const employment = (orgName: string, isMainEmployment = false): UserEmploymentDTO => ({
  orgId: 42,
  orgName,
  isMainEmployment,
});

const renderForm = (schemaId: string, formData?: Record<string, unknown>) =>
  render(<SchemaForm schemaId={schemaId} schema={schema} uiSchema={uiSchema} formData={formData} hideSubmitButton />);

beforeEach(() => {
  useMetadataStore.setState({ metadata: { labels: { labelStructure: placeLabelStructure } } });
});

afterEach(() => {
  employmentsMock.mockReset();
});

/**
 * Platsvalet avgör vilka som får se ärendet. Den som rapporterar åt en annan verksamhet än
 * sin egen ska därför inte kunna skicka in på en plats som fyllts i åt hen — förslaget måste
 * bekräftas aktivt innan det blir ett värde.
 */
describe('FacilitySearchWidget employment suggestion', () => {
  it('offers the employment as a suggestion without selecting it', async () => {
    employmentsMock.mockResolvedValue([employment('Anläggning utan avdelning', true)]);

    renderForm('facility-suggestion:1');

    const suggestion = await findCy('facility-suggestion');
    expect(suggestion).toHaveTextContent('Anläggning utan avdelning');
    expect(suggestion).toHaveTextContent('facility_search.suggestion_header');

    // Kortet för vald plats renderas bara när värdet faktiskt är satt. Att det saknas här
    // är beviset för att förslaget inte räknas som ett val.
    expect(cy('facility-card')).not.toBeInTheDocument();
  });

  it('selects the place only once the user confirms it', async () => {
    employmentsMock.mockResolvedValue([employment('Anläggning utan avdelning', true)]);
    const user = userEvent.setup();

    renderForm('facility-confirm:1');

    await user.click(await findCy('facility-accept-suggestion-button'));

    const card = await findCy('facility-card');
    expect(card).toHaveTextContent('Anläggning utan avdelning');
    expect(cy('facility-suggestion')).not.toBeInTheDocument();
  });

  it('prefers the main employment when the user has several', async () => {
    // Backend sorterar huvudanställningen först; widgeten tar första träffen.
    employmentsMock.mockResolvedValue([employment('Anläggning utan avdelning', true), employment('Annan anläggning')]);

    renderForm('facility-main-employment:1');

    const suggestion = await findCy('facility-suggestion');
    expect(suggestion).toHaveTextContent('Anläggning utan avdelning');
    expect(suggestion).not.toHaveTextContent('Annan anläggning');
  });

  it('does not suggest anything when no employment matches the place structure', async () => {
    employmentsMock.mockResolvedValue([employment('Verksamhet i ett annat namespace', true)]);

    renderForm('facility-no-match:1');

    await waitFor(() => {
      expect(employmentsMock).toHaveBeenCalled();
    });
    expect(cy('facility-suggestion')).not.toBeInTheDocument();
    expect(cy('facility-card')).not.toBeInTheDocument();
  });

  // Ett sparat utkast bär ett val användaren redan gjort. Att presentera det som en gissning
  // vore fel, och att kräva ett nytt godkännande vore bara i vägen.
  it('treats an already saved place as a choice, not a suggestion', async () => {
    employmentsMock.mockResolvedValue([employment('Anläggning utan avdelning', true)]);

    renderForm('facility-saved:1', { facility: { orgName: 'Annan anläggning' } });

    expect(await findCy('facility-card')).toHaveTextContent('Annan anläggning');
    expect(cy('facility-suggestion')).not.toBeInTheDocument();
  });

  it('does not bring the suggestion back after the user clears the place', async () => {
    employmentsMock.mockResolvedValue([employment('Anläggning utan avdelning', true)]);
    const user = userEvent.setup();

    renderForm('facility-cleared:1');

    await user.click(await findCy('facility-accept-suggestion-button'));
    await user.click(await findCy('facility-change-button'));

    // Har användaren aktivt rensat platsen är anställningen inte längre en rimlig gissning.
    await waitFor(() => {
      expect(cy('facility-card')).not.toBeInTheDocument();
    });
    expect(cy('facility-suggestion')).not.toBeInTheDocument();
  });
});
