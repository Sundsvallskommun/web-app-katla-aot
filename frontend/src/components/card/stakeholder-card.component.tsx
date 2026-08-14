import { StakeholderFormModal } from '@components/misc/stakeholder-modal.component';
import { useIsContentLocked } from '@contexts/errand-content-lock-context';
import { StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { Button } from '@sk-web-gui/react';
import { getStakeholderRoleDisplayName, shouldShowContactDetails } from '@utils/stakeholder';
import { Pen, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMetadataStore } from 'src/stores/metadata-store';

export const StakeholderCard: React.FC<{
  stakeholder: StakeholderDTO;
  isEditable?: boolean;
  hideRemove?: boolean;
  editableFields?: (keyof StakeholderDTO)[];
  onRemove?: () => void;
  index?: number;
  roles?: string[];
}> = ({ stakeholder, isEditable, hideRemove, editableFields, onRemove, index, roles }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { metadata } = useMetadataStore();
  const isLocked = useIsContentLocked();

  return (
    <>
      <div
        data-cy="stakeholder-card"
        className="border-1 rounded-12 bg-background-content w-full max-w-[52.5rem] my-15"
      >
        <div className="rounded-t-12 bg-vattjom-background-200 h-[4rem] flex items-center mb-[1.5rem]">
          <strong data-cy="stakeholder-role" className="px-[1rem]">
            {getStakeholderRoleDisplayName(stakeholder, metadata?.roles)}
          </strong>
        </div>
        <div className="px-[1rem]">
          <p data-cy="stakeholder-name" className="text-[1.6rem] font-semibold break-words">
            {stakeholder.firstName} {stakeholder.lastName}
          </p>

          {shouldShowContactDetails(roles) && (
            // Kolumnerna staplas på smal skärm; break-words ärvs ned så att långa
            // e-postadresser bryts i stället för att tvinga fram sidbredd.
            <div className="flex text-md mb-10 flex-col sm:flex-row gap-y-4 gap-x-15 break-words">
              <div className="flex flex-col min-w-0">
                {stakeholder.title && (
                  <div data-cy="stakeholder-title" className="mr-10">
                    {stakeholder.title}
                  </div>
                )}
                {stakeholder.personNumber && !stakeholder.title && (
                  <div data-cy="stakeholder-personNumber" className="mr-10">
                    {stakeholder.personNumber}
                  </div>
                )}
                {stakeholder.department ?
                  <div data-cy="stakeholder-department" className="">
                    {stakeholder.department}
                  </div>
                : <div data-cy="stakeholder-address">
                    {stakeholder.address} {stakeholder.city}
                  </div>
                }
              </div>
              <div className="flex flex-col min-w-0">
                <div data-cy="stakeholder-email">
                  {stakeholder.emails?.[0] ?? t('errand-information:stakeholder.missing_email')}
                </div>
                <div data-cy="stakeholder-phonenumber">
                  {stakeholder.phoneNumbers?.[0] ?? t('errand-information:stakeholder.missing_phone')}
                </div>
              </div>
            </div>
          )}

          {isEditable && !isLocked && (
            <div className="flex flex-col sm:flex-row gap-[1rem] mb-10">
              <Button
                data-cy="edit-card-button"
                leftIcon={<Pen size={16} />}
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                {t('errand-information:stakeholder.edit_details')}
              </Button>
              {!hideRemove && (
                <Button
                  data-cy="remove-card-button"
                  leftIcon={<X size={16} />}
                  variant="tertiary"
                  size="sm"
                  onClick={onRemove}
                >
                  {t('errand-information:stakeholder.remove')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <StakeholderFormModal
        edit
        index={index}
        initialValues={stakeholder}
        show={isOpen}
        roles={roles ?? []}
        editableFields={editableFields}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
};
