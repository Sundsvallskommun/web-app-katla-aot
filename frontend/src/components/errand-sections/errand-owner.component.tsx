'use client';

import { StakeholderCard } from '@components/card/stakeholder-card.component';
import { ErrandDisclosure } from '@components/disclosure/errand-information-disclosure.component';
import { ErrandOwnerModal } from '@components/errand-sections/errand-owner-modal.component';
import { ErrorAlert } from '@components/misc/error-alert.component';
import { useIsContentLocked } from '@contexts/errand-content-lock-context';
import { useFormValidation } from '@contexts/form-validation-context';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { Button, FormControl, FormErrorMessage, FormLabel, Select, Spinner } from '@sk-web-gui/react';
import { INVALID_FIELD_ATTRIBUTE } from '@utils/focus-first-error';
import {
  getPrimaryStakeholder,
  PRIMARY_STAKEHOLDER_ROLE,
  withoutPrimaryStakeholder,
  withPrimaryStakeholder,
} from '@utils/stakeholder';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMyOrganizations } from 'src/hooks/use-my-organizations';

const OWNER_FIELD_ID = 'errand-owner';

export const ErrandOwnerContent: React.FC = () => {
  const { t } = useTranslation();
  const { organizations, organizationsError, organizationsLoadState } = useMyOrganizations();
  const { showValidation } = useFormValidation();
  const isLocked = useIsContentLocked();
  const { setValue, watch } = useFormContext<ErrandFormDTO>();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const stakeholders = watch('stakeholders');
  const owner = getPrimaryStakeholder(stakeholders);
  const selectedPartyId = owner?.externalId;
  // The organisation number is not part of the stakeholder, so the card gets it from the
  // organisation the party id belongs to.
  const selectedOrganization = organizations.find((organization) => organization.partyId === selectedPartyId);

  const selectPartyId = (partyId: string) => {
    const organization = organizations.find((candidate) => candidate.partyId === partyId);

    setValue(
      'stakeholders',
      organization ? withPrimaryStakeholder(stakeholders, organization) : withoutPrimaryStakeholder(stakeholders),
      { shouldDirty: true }
    );
  };

  // A citizen with a single engagement has nothing to choose between, so the one option is
  // preselected rather than left as a required click. Never on a locked errand, whose owner is
  // whatever was filed.
  useEffect(() => {
    if (isLocked || selectedPartyId !== undefined || organizations.length !== 1) return;
    setValue('stakeholders', withPrimaryStakeholder(stakeholders, organizations[0]), { shouldDirty: true });
  }, [isLocked, organizations, selectedPartyId, setValue, stakeholders]);

  const replaceOwner = (updated: StakeholderDTO) => {
    setValue('stakeholders', [...withoutPrimaryStakeholder(stakeholders), updated], { shouldDirty: true });
  };

  const hasError = showValidation && selectedPartyId === undefined;
  const invalidFieldProps = hasError ? { [INVALID_FIELD_ATTRIBUTE]: OWNER_FIELD_ID } : {};

  return (
    <div className="flex flex-col gap-[2.4rem] pb-[2.4rem]">
      <span className="text-dark-secondary">{t('errand-information:owner.description')}</span>

      {organizationsLoadState === 'loading' && <Spinner aria-label={t('forms:loading')} />}

      {organizationsError && <ErrorAlert message={organizationsError} />}

      {organizationsLoadState === 'ready' && organizations.length === 0 && (
        <span data-cy="no-organizations" className="text-dark-secondary">
          {t('errand-information:owner.no_organizations')}
        </span>
      )}

      {organizationsLoadState === 'ready' && organizations.length > 0 && (
        <div>
          {/* The card carries the choice once made, so the select is hidden on a locked errand
              rather than shown as a dead control. */}
          {!isLocked && (
            <FormControl required invalid={hasError} className="w-full sm:w-[calc(50%-10px)]" {...invalidFieldProps}>
              <FormLabel htmlFor={OWNER_FIELD_ID}>{t('errand-information:owner.select_label')}</FormLabel>
              <Select
                id={OWNER_FIELD_ID}
                data-cy="errand-owner-select"
                className="w-full"
                value={selectedPartyId ?? ''}
                aria-invalid={hasError}
                onChange={(event) => {
                  selectPartyId(event.target.value);
                }}
              >
                <Select.Option value="">{t('errand-information:owner.select_placeholder')}</Select.Option>
                {organizations.map((organization) => (
                  <Select.Option key={organization.partyId} value={organization.partyId}>
                    {organization.organizationName}
                  </Select.Option>
                ))}
              </Select>
              {hasError && (
                <FormErrorMessage data-cy="errand-owner-error" className="text-error">
                  {t('validation:owner.required')}
                </FormErrorMessage>
              )}
            </FormControl>
          )}

          {owner && (
            <>
              <StakeholderCard
                stakeholder={owner}
                roles={[PRIMARY_STAKEHOLDER_ROLE]}
                organizationNumber={selectedOrganization?.organizationNumber}
                roleLabel={t('errand-information:owner.title')}
                headerActions={
                  <>
                    <Button
                      data-cy="edit-owner-button"
                      variant="link"
                      onClick={() => {
                        setIsEditOpen(true);
                      }}
                    >
                      {t('errand-information:stakeholder.edit_details')}
                    </Button>
                    <Button
                      data-cy="remove-owner-button"
                      variant="link"
                      onClick={() => {
                        selectPartyId('');
                      }}
                    >
                      {t('errand-information:stakeholder.remove')}
                    </Button>
                  </>
                }
              />
              <ErrandOwnerModal
                owner={owner}
                organizationNumber={selectedOrganization?.organizationNumber}
                show={isEditOpen}
                onClose={() => {
                  setIsEditOpen(false);
                }}
                onSave={replaceOwner}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const ErrandOwner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ErrandDisclosure header={t('errand-information:owner.title')} icon={<Building2 />}>
      <ErrandOwnerContent />
    </ErrandDisclosure>
  );
};
