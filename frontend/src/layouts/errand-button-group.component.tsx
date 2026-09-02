import i18nConfig from '@app/i18nConfig';
import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import {
  errandFormDataContractErrorMessage,
  jsonParametersToErrandFormData,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { Button, Dialog, useSnackbar } from '@sk-web-gui/react';
import { Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';

import { CenterDiv } from './center-div.component';

interface ErrandButtonGroupProps {
  isNewErrand: boolean;
}

export const ErrandButtonGroup: React.FC<ErrandButtonGroupProps> = ({ isNewErrand }) => {
  const { t } = useTranslation();
  const { t: tForms, i18n } = useTranslation('forms');
  const locale = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;
  const toastMessage = useSnackbar();
  const router = useRouter();
  const context = useFormContext<ErrandFormDTO>();
  const { getValues, reset, watch } = context;
  const { setShowValidation, focusFirstError } = useFormValidation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const { prepareErrandForApi } = usePrepareErrand();

  const errandStatus = watch('status');
  const errandId = watch('id');

  const isDraft = errandStatus === 'DRAFT';
  const showButtons = isNewErrand || isDraft;
  const draftEnabled = appConfig.features.draftEnabled;

  const onSaveDraft = async () => {
    try {
      const errandData = prepareErrandForApi(getValues(), 'DRAFT');
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });

      if (isNewErrand) {
        router.push(`/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch (error: unknown) {
      toastMessage({
        position: 'bottom',
        status: 'error',
        message: errandFormDataContractErrorMessage(error, tForms) ?? t('errand-information:save_message.error'),
      });
    }
  };

  const onRegister = async (logout?: boolean) => {
    setIsOpen(false);

    try {
      const errandData = prepareErrandForApi(getValues(), 'NEW');
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.register') });
      reset({ ...errand, errandFormData });

      if (logout) {
        router.push(`/logout`);
      } else {
        router.push(`/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch (error: unknown) {
      toastMessage({
        position: 'bottom',
        status: 'error',
        message: errandFormDataContractErrorMessage(error, tForms) ?? t('errand-information:save_message.error'),
      });
    }
  };

  // Felmeddelandet berättar vad som saknas och fokus flyttas till fältet, så att det går att
  // åtgärda direkt även när fältet ligger långt ner eller i ett hopfällt avsnitt.
  const reportValidationError = (message: string) => {
    toastMessage({ position: 'bottom', status: 'error', message });
    focusFirstError();
  };

  const onValidateBeforeRegister = async () => {
    // Aktivera validering för JSON-formulär
    setShowValidation(true);

    const values = getValues();
    const formDataErrors = await validateErrandFormData(values.errandFormData, tForms, locale);

    if (formDataErrors.length > 0) {
      reportValidationError(formDataErrors[0]);
      return;
    }

    setIsOpen(true);
  };

  if (!showButtons) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-8 md:gap-[1.8rem]">
      {isNewErrand && (
        <Button
          variant="secondary"
          onClick={() => {
            setIsCancelOpen(true);
          }}
        >
          {t('errand-information:cancel')}
        </Button>
      )}
      {draftEnabled && (
        <Button
          data-cy="save-draft-errand"
          variant="primary"
          onClick={() => {
            void onSaveDraft();
          }}
        >
          {t('errand-information:save_draft')}
        </Button>
      )}
      <Button
        data-cy="register-errand"
        variant="primary"
        color="vattjom"
        onClick={() => {
          void onValidateBeforeRegister();
        }}
      >
        {t('errand-information:register')}
      </Button>
      <CancelErrandDialog
        show={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
        }}
        onConfirm={() => {
          router.push('/oversikt');
        }}
      />
      <Dialog show={isOpen}>
        <Dialog.Content className="-mt-20">
          <CenterDiv>
            <Inbox size={32} className="mb-[1.6rem] text-vattjom-surface-primary" />
            <h3 className="text-h3-md">{t('errand-information:register')}</h3>
            <span className="text-dark-secondary text-md">{t('errand-information:submit_confirm.question')}</span>
          </CenterDiv>
        </Dialog.Content>

        <Dialog.Buttons className="justify-center flex-col sm:flex-row gap-8">
          <Button
            variant="secondary"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            {t('errand-information:submit_confirm.no')}
          </Button>
          <Button
            data-cy="submit-button"
            variant="primary"
            onClick={() => {
              void onRegister();
            }}
          >
            {t('errand-information:submit_confirm.submit')}
          </Button>
          <Button
            data-cy="submit-logout-button"
            variant="primary"
            color="vattjom"
            onClick={() => {
              void onRegister(true);
            }}
          >
            {t('errand-information:submit_confirm.submit_and_logout')}
          </Button>
        </Dialog.Buttons>
      </Dialog>
    </div>
  );
};
