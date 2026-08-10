import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import {
  jsonParametersToErrandFormData,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { Inbox } from 'lucide-react';
import { Button, Dialog, useSnackbar } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CenterDiv } from './center-div.component';
import { appConfig } from 'src/config/appconfig';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';
import { ErrandFormDTO } from '@interfaces/errand-form';

interface ErrandButtonGroupProps {
  isNewErrand: boolean;
}

export const ErrandButtonGroup: React.FC<ErrandButtonGroupProps> = ({ isNewErrand }) => {
  const { t } = useTranslation();
  const { t: tForms } = useTranslation('forms');
  const toastMessage = useSnackbar();
  const router = useRouter();
  const context = useFormContext<ErrandFormDTO>();
  const { getValues, reset, watch } = context;
  const { setShowValidation } = useFormValidation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const { prepareErrandForApi, getFacilityOrgName } = usePrepareErrand();

  const errandStatus = watch('status');
  const errandId = watch('id');

  const isDraft = errandStatus === 'DRAFT';
  const showButtons = isNewErrand || isDraft;
  const draftEnabled = appConfig.features.draftEnabled;

  const onSaveDraft = async () => {
    const errandData = prepareErrandForApi(getValues(), 'DRAFT');

    try {
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });

      if (isNewErrand) {
        router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch {
      toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
    }
  };

  const onRegister = async (logout?: boolean) => {
    setIsOpen(false);

    const errandData = prepareErrandForApi(getValues(), 'NEW');

    try {
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.register') });
      reset({ ...errand, errandFormData });

      if (logout) {
        router.push(`/logout`);
      } else {
        router.push(`/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch {
      toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
    }
  };

  if (!showButtons) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-8 md:gap-[1.8rem]">
      {isNewErrand && (
        <Button variant="secondary" onClick={() => setIsCancelOpen(true)}>
          {t('errand-information:cancel')}
        </Button>
      )}
      {draftEnabled && (
        <Button data-cy="save-draft-errand" variant="primary" onClick={() => onSaveDraft()}>
          {t('errand-information:save_draft')}
        </Button>
      )}
      <Button
        data-cy="register-errand"
        variant="primary"
        color="vattjom"
        onClick={async () => {
          // Aktivera validering för JSON-formulär
          setShowValidation(true);

          // Validera att eventType och eventConcerns är valda
          const values = getValues();
          const eventType = values.parameters?.find((p) => p.key === 'eventType')?.values?.[0];
          const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];
          if (!eventType) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: t('errand-information:about.event_type_required'),
            });
            return;
          }
          if (!eventConcerns) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: t('errand-information:about.event_concerns_required'),
            });
            return;
          }
          if (eventConcerns === 'GRUPP_VERKSAMHET' && !getFacilityOrgName(values.errandFormData)) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: t('errand-information:about.event_concerns_group_facility_required'),
            });
            return;
          }

          // Validera errandFormData
          const formDataErrors = await validateErrandFormData(values.errandFormData, tForms);

          if (formDataErrors.length > 0) {
            toastMessage({
              position: 'bottom',
              status: 'error',
              message: formDataErrors[0],
            });
            return;
          }

          setIsOpen(true);
        }}
      >
        {t('errand-information:register')}
      </Button>
      <CancelErrandDialog
        show={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={() => router.push('/oversikt')}
      />
      <Dialog show={isOpen}>
        <Dialog.Content className="-mt-20">
          <CenterDiv>
            <Inbox size={32} className="mb-[1.6rem] text-vattjom-surface-primary" />
            <h3 className="text-h3-md">{t('errand-information:register')}</h3>
            <span className="text-dark-secondary text-md">Vill du skicka in ärendet?</span>
          </CenterDiv>
        </Dialog.Content>

        <Dialog.Buttons className="justify-center flex-col sm:flex-row gap-8">
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Nej
          </Button>
          <Button data-cy="submit-button" variant="primary" onClick={() => onRegister()}>
            Skicka in
          </Button>
          <Button data-cy="submit-logout-button" variant="primary" color="vattjom" onClick={() => onRegister(true)}>
            Skicka in och logga ut
          </Button>
        </Dialog.Buttons>
      </Dialog>
    </div>
  );
};
