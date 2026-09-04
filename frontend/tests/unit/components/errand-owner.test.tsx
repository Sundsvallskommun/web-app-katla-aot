import { ErrandContentLock } from '@components/errand-content-lock/errand-content-lock.component';
import { ErrandOwnerContent } from '@components/errand-sections/errand-owner.component';
import { FormValidationProvider } from '@contexts/form-validation-provider';
import { OrganizationDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { useMetadataStore } from 'src/stores/metadata-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMyOrganizationsMock } = vi.hoisted(() => ({ getMyOrganizationsMock: vi.fn() }));

vi.mock('@services/organization-service/organization-service', () => ({
  getMyOrganizations: getMyOrganizationsMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('src/config/appconfig', () => ({
  appConfig: { features: { disclosureDoneMark: false } },
}));

const ACME: OrganizationDTO = {
  partyId: 'f1e2d3c4-0000-4000-8000-000000000001',
  organizationNumber: '5560000001',
  organizationName: 'Acme Restaurang AB',
};

const BOLAGET: OrganizationDTO = {
  partyId: 'f1e2d3c4-0000-4000-8000-000000000002',
  organizationNumber: '5560000002',
  organizationName: 'Bolaget Krog HB',
};

// Rendered rather than captured in a variable: reassigning during render is a side effect, and
// the DOM is what the assertions can wait on anyway.
const StakeholderProbe: React.FC = () => {
  const { watch } = useFormContext<ErrandFormDTO>();
  return <span data-testid="stakeholders">{JSON.stringify(watch('stakeholders'))}</span>;
};

/** The app marks test targets with data-cy, which is not RTL's default testId attribute. */
const queryCy = (name: string): HTMLElement | null => document.querySelector<HTMLElement>(`[data-cy="${name}"]`);

/** As queryCy, for targets that must exist: a missing one is a broken test, not a null check. */
const getCy = (name: string): HTMLElement => {
  const element = queryCy(name);
  if (!element) throw new Error(`No element with data-cy="${name}"`);
  return element;
};

const currentStakeholders = (): ErrandFormDTO['stakeholders'] => {
  const rendered = screen.getByTestId('stakeholders').textContent;
  return rendered ? (JSON.parse(rendered) as ErrandFormDTO['stakeholders']) : undefined;
};

const renderOwner = (defaultValues: Partial<ErrandFormDTO> = {}) => {
  const TestForm: React.FC = () => {
    const methods = useForm<ErrandFormDTO>({ defaultValues: { status: 'DRAFT', ...defaultValues } });

    return (
      <FormProvider {...methods}>
        <FormValidationProvider>
          <ErrandContentLock>
            <ErrandOwnerContent />
          </ErrandContentLock>
          <StakeholderProbe />
        </FormValidationProvider>
      </FormProvider>
    );
  };

  return render(<TestForm />);
};

describe('ErrandOwner', () => {
  beforeEach(() => {
    getMyOrganizationsMock.mockReset();
    // The owner card labels itself rather than looking the role up in metadata, which does not
    // name PRIMARY in this namespace. Seeded with a wrong label so a regression to the lookup shows.
    useMetadataStore.setState({ metadata: { roles: [{ name: 'PRIMARY', displayName: 'Fel etikett' }] } });
  });

  it('lists the organizations the citizen has engagements in', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME, BOLAGET]);
    renderOwner();

    const select = await screen.findByRole('combobox');
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['errand-information:owner.select_placeholder', 'Acme Restaurang AB', 'Bolaget Krog HB']);
  });

  it('files the chosen organization as the primary stakeholder', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME, BOLAGET]);
    renderOwner();

    fireEvent.change(await screen.findByRole('combobox'), { target: { value: BOLAGET.partyId } });

    await waitFor(() => {
      expect(currentStakeholders()).toEqual([
        {
          role: 'PRIMARY',
          externalId: BOLAGET.partyId,
          externalIdType: 'COMPANY',
          organizationName: 'Bolaget Krog HB',
        },
      ]);
    });
  });

  it('replaces the owner rather than adding a second one, keeping other stakeholders', async () => {
    const contact = { role: 'CONTACT', firstName: 'Anna', lastName: 'Andersson' };
    getMyOrganizationsMock.mockResolvedValue([ACME, BOLAGET]);
    renderOwner({ stakeholders: [contact] });

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: ACME.partyId } });
    fireEvent.change(select, { target: { value: BOLAGET.partyId } });

    await waitFor(() => {
      expect(currentStakeholders()).toEqual([
        contact,
        expect.objectContaining({ role: 'PRIMARY', externalId: BOLAGET.partyId }),
      ]);
    });
  });

  it('preselects the only organization, since there is nothing to choose between', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME]);
    renderOwner();

    await waitFor(() => {
      expect(currentStakeholders()).toEqual([expect.objectContaining({ externalId: ACME.partyId })]);
    });
    expect(await screen.findByRole('combobox')).toHaveValue(ACME.partyId);
  });

  it('leaves a submitted errand alone rather than preselecting into it', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME]);
    renderOwner({ status: 'NEW' });

    await waitFor(() => {
      expect(getMyOrganizationsMock).toHaveBeenCalled();
    });
    // The select belongs to editing; a submitted errand shows only the card it was filed with.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(currentStakeholders()).toBeUndefined();
  });

  it('shows the errand owner selected on a loaded errand', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME, BOLAGET]);
    renderOwner({
      stakeholders: [
        {
          role: 'PRIMARY',
          externalId: BOLAGET.partyId,
          externalIdType: 'COMPANY',
          organizationName: 'Bolaget Krog HB',
        },
      ],
    });

    expect(await screen.findByRole('combobox')).toHaveValue(BOLAGET.partyId);
    expect(queryCy('stakeholder-name')).toHaveTextContent('Bolaget Krog HB');
  });

  it('renders the chosen organization as a card with its organization number', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME, BOLAGET]);
    renderOwner();

    fireEvent.change(await screen.findByRole('combobox'), { target: { value: ACME.partyId } });

    await waitFor(() => {
      expect(queryCy('stakeholder-card')).toBeInTheDocument();
    });
    expect(queryCy('stakeholder-name')).toHaveTextContent('Acme Restaurang AB');
    expect(queryCy('stakeholder-organizationNumber')).toHaveTextContent(ACME.organizationNumber);
    expect(queryCy('stakeholder-role')).toHaveTextContent('errand-information:owner.title');
    // An organisation has no person contact details to show.
    expect(queryCy('stakeholder-email')).toBeNull();
  });

  it('removes the owner from the card action', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME, BOLAGET]);
    renderOwner();

    fireEvent.change(await screen.findByRole('combobox'), { target: { value: ACME.partyId } });
    await waitFor(() => {
      expect(queryCy('stakeholder-card')).toBeInTheDocument();
    });

    fireEvent.click(getCy('remove-owner-button'));

    await waitFor(() => {
      expect(currentStakeholders()).toEqual([]);
    });
    expect(queryCy('stakeholder-card')).toBeNull();
    expect(await screen.findByRole('combobox')).toHaveValue('');
  });

  it('keeps the contact details entered for the owner, and shows them on the card', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME]);
    renderOwner();

    await waitFor(() => {
      expect(queryCy('stakeholder-card')).toBeInTheDocument();
    });
    fireEvent.click(getCy('edit-owner-button'));

    // Identity is shown for recognition but never editable here.
    expect(queryCy('owner-organizationNumber')).toHaveValue(ACME.organizationNumber);
    expect(queryCy('owner-organizationNumber')).toHaveAttribute('readonly');
    expect(queryCy('owner-organizationName')).toHaveAttribute('readonly');

    fireEvent.change(getCy('owner-serveringsstalle-input'), { target: { value: 'Acme Krogen' } });
    fireEvent.change(getCy('owner-address-input'), { target: { value: 'Storgatan 1' } });
    fireEvent.change(getCy('owner-email-input'), { target: { value: 'post@acme.se' } });
    fireEvent.click(getCy('owner-email-add'));
    fireEvent.click(getCy('owner-modal-save'));

    await waitFor(() => {
      expect(currentStakeholders()).toEqual([
        expect.objectContaining({
          role: 'PRIMARY',
          externalId: ACME.partyId,
          serveringsstalle: 'Acme Krogen',
          address: 'Storgatan 1',
          emails: ['post@acme.se'],
        }),
      ]);
    });
    expect(queryCy('stakeholder-serveringsstalle')).toHaveTextContent('Acme Krogen');
    expect(queryCy('stakeholder-email')).toHaveTextContent('post@acme.se');
  });

  it('refuses an invalid e-mail rather than attaching it to the errand', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME]);
    renderOwner();

    await waitFor(() => {
      expect(queryCy('stakeholder-card')).toBeInTheDocument();
    });
    fireEvent.click(getCy('edit-owner-button'));
    fireEvent.change(getCy('owner-email-input'), { target: { value: 'inte-en-adress' } });
    fireEvent.click(getCy('owner-email-add'));

    await waitFor(() => {
      expect(queryCy('owner-email-error')).toBeInTheDocument();
    });
    expect(queryCy('owner-email-value')).toBeNull();
  });

  it('clearing the choice drops the owner', async () => {
    getMyOrganizationsMock.mockResolvedValue([ACME, BOLAGET]);
    renderOwner();

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: ACME.partyId } });
    await waitFor(() => {
      expect(queryCy('stakeholder-card')).toBeInTheDocument();
    });

    fireEvent.change(select, { target: { value: '' } });

    await waitFor(() => {
      expect(currentStakeholders()).toEqual([]);
    });
    expect(queryCy('stakeholder-card')).toBeNull();
  });

  it('reports an error instead of an empty list when the organizations cannot be read', async () => {
    getMyOrganizationsMock.mockRejectedValue(new Error('boom'));
    renderOwner();

    expect(await screen.findByRole('alert')).toHaveTextContent('api_errors.organizations');
    expect(screen.queryByText('errand-information:owner.no_organizations')).not.toBeInTheDocument();
  });

  it('says so when the citizen has no organizations to file for', async () => {
    getMyOrganizationsMock.mockResolvedValue([]);
    renderOwner();

    expect(await screen.findByText('errand-information:owner.no_organizations')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
