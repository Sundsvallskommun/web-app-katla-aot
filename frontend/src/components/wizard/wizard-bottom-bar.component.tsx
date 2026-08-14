import i18nConfig from '@app/i18nConfig';
import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import {
  errandFormDataContractErrorMessage,
  jsonParametersToErrandFormData,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { CenterDiv } from '@layouts/center-div.component';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { Button, Dialog, useSnackbar } from '@sk-web-gui/react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';
import { useWizardStore } from 'src/stores/wizard-store';

import { validateStep } from './wizard-step-validator';

export const WizardBottomBar: React.FC = () => {
  const { t } = useTranslation();
  const { t: tForms, i18n } = useTranslation('forms');
  const locale = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;
  const toastMessage = useSnackbar();
  const router = useRouter();
  const { getValues, reset, watch } = useFormContext<ErrandFormDTO>();
  const { setShowValidation, focusFirstError } = useFormValidation();
  const { currentStep, goNext, goBack, setStepErrors } = useWizardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { prepareErrandForApi, getFacilityStatus } = usePrepareErrand();

  const steps = useActiveWizardSteps();
  const errandId = watch('id');
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const draftEnabled = appConfig.features.draftEnabled;

  const onSaveDraft = async () => {
    try {
      const errandData = prepareErrandForApi(getValues(), 'DRAFT');
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });
      router.push(`/arende/${errand.errandNumber}/grundinformation`);
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
      toastMessage({
        position: 'bottom',
        status: 'success',
        message: t('errand-information:save_message.register'),
      });
      reset({ ...errand, errandFormData });
      if (logout) {
        router.push('/logout');
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
  // åtgärda direkt även när fältet ligger långt ner i steget.
  const reportValidationError = (message: string) => {
    toastMessage({ position: 'bottom', status: 'error', message });
    focusFirstError();
  };

  const handleNext = async () => {
    const step = steps[currentStep];
    const errors = await validateStep(step, getValues(), step.id === 'deviation' ? tForms : t, locale);
    setStepErrors(currentStep, errors);

    if (errors.length > 0) {
      setShowValidation(true);
      reportValidationError(errors[0]);
      return;
    }

    setShowValidation(false);
    goNext();
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    const values = getValues();
    const eventType = values.parameters?.find((p) => p.key === 'eventType')?.values?.[0];
    const eventConcerns = values.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];

    if (!eventType) {
      reportValidationError(t('errand-information:about.event_type_required'));
      return;
    }
    if (!eventConcerns) {
      reportValidationError(t('errand-information:about.event_concerns_required'));
      return;
    }
    const formDataErrors = await validateErrandFormData(values.errandFormData, tForms, locale);
    if (formDataErrors.length > 0) {
      reportValidationError(formDataErrors[0]);
      return;
    }

    const facilityStatus = getFacilityStatus(values.errandFormData);
    if (eventConcerns === 'GRUPP_VERKSAMHET' && facilityStatus === 'NONE') {
      reportValidationError(t('errand-information:about.event_concerns_group_facility_required'));
      return;
    }
    // En plats som inte är vald hela vägen ner ger fel label, och därmed fel behörighet
    if (facilityStatus === 'INCOMPLETE') {
      reportValidationError(t('errand-information:about.facility_incomplete'));
      return;
    }

    setIsOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-center px-16 py-12 bg-background-content border-t-1 border-divider gap-12">
        {!isFirstStep && (
          <Button
            size="sm"
            variant="tertiary"
            leftIcon={<ChevronLeft size={18} />}
            onClick={() => {
              setShowValidation(false);
              goBack();
            }}
            className="flex-1"
          >
            {t('errand-information:wizard.back')}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setIsCancelOpen(true);
          }}
          className="flex-1"
        >
          {t('errand-information:wizard.cancel')}
        </Button>
        {draftEnabled && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              void onSaveDraft();
            }}
            className="flex-1"
          >
            {t('errand-information:wizard.save')}
          </Button>
        )}
        {isLastStep ?
          <Button
            size="sm"
            variant="primary"
            color="vattjom"
            onClick={() => {
              void handleSubmit();
            }}
            className="flex-1"
          >
            {t('errand-information:wizard.submit')}
          </Button>
        : <Button
            size="sm"
            variant="primary"
            color="vattjom"
            rightIcon={<ChevronRight size={18} />}
            onClick={() => {
              void handleNext();
            }}
            className="flex-1"
          >
            {t('errand-information:wizard.next')}
          </Button>
        }
      </div>

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
    </>
  );
};
