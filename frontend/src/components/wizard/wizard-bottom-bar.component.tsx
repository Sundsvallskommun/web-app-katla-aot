import { CancelErrandDialog } from '@components/cancel-errand-dialog.component';
import {
  jsonParametersToErrandFormData,
  validateErrandFormData,
} from '@components/json/utils/schema-utils';
import { useFormValidation } from '@contexts/form-validation-context';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { createErrand, updateErrand } from '@services/errand-service/errand-service';
import { Button, Dialog, useSnackbar } from '@sk-web-gui/react';
import { CenterDiv } from '@layouts/center-div.component';
import { appConfig } from 'src/config/appconfig';
import { usePrepareErrand } from 'src/hooks/use-prepare-errand';
import { useWizardStore } from 'src/stores/wizard-store';
import { validateStep } from './wizard-step-validator';
import { useActiveWizardSteps } from 'src/hooks/use-active-wizard-steps';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const WizardBottomBar: React.FC = () => {
  const { t } = useTranslation();
  const { t: tForms } = useTranslation('forms');
  const toastMessage = useSnackbar();
  const router = useRouter();
  const { getValues, reset, watch } = useFormContext<ErrandFormDTO>();
  const { setShowValidation } = useFormValidation();
  const { currentStep, goNext, goBack, setStepErrors } = useWizardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { prepareErrandForApi, getFacilityOrgName } = usePrepareErrand();

  const steps = useActiveWizardSteps();
  const errandId = watch('id');
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const draftEnabled = appConfig.features.draftEnabled;

  const onSaveDraft = async () => {
    const errandData = prepareErrandForApi(getValues(), 'DRAFT');
    try {
      const errand = await (errandId ? updateErrand(errandId, errandData) : createErrand(errandData));
      const errandFormData = jsonParametersToErrandFormData(errand.jsonParameters);
      toastMessage({ position: 'bottom', status: 'success', message: t('errand-information:save_message.draft') });
      reset({ ...errand, errandFormData });
      router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`);
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
      toastMessage({
        position: 'bottom',
        status: 'success',
        message: t('errand-information:save_message.register'),
      });
      reset({ ...errand, errandFormData });
      if (logout) {
        router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/logout`);
      } else {
        router.push(`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/${errand.errandNumber}/grundinformation`);
      }
    } catch {
      toastMessage({ position: 'bottom', status: 'error', message: t('errand-information:save_message.error') });
    }
  };

  const handleNext = async () => {
    const step = steps[currentStep];
    const errors = await validateStep(step, getValues(), t);
    setStepErrors(currentStep, errors);

    if (errors.length > 0) {
      setShowValidation(true);
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
  };

  return (
    <>
      <div className="flex items-center justify-center px-16 py-12 bg-background-content border-t-1 border-divider gap-12">
        {!isFirstStep && (
          <Button size="sm" variant="tertiary" leftIcon={<ChevronLeft size={18} />} onClick={() => { setShowValidation(false); goBack(); }} className="flex-1">
            {t('errand-information:wizard.back')}
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => setIsCancelOpen(true)} className="flex-1">
          {t('errand-information:wizard.cancel')}
        </Button>
        {draftEnabled && (
          <Button size="sm" variant="primary" onClick={onSaveDraft} className="flex-1">
            {t('errand-information:wizard.save')}
          </Button>
        )}
        {isLastStep ?
          <Button size="sm" variant="primary" color="vattjom" onClick={handleSubmit} className="flex-1">
            {t('errand-information:wizard.submit')}
          </Button>
        : <Button
            size="sm"
            variant="primary"
            color="vattjom"
            rightIcon={<ChevronRight size={18} />}
            onClick={handleNext}
            className="flex-1"
          >
            {t('errand-information:wizard.next')}
          </Button>
        }
      </div>

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
    </>
  );
};
