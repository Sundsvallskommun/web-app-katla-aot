import { validateErrandFormData } from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';
import type { TFunction } from 'i18next';
import { WizardStep } from './wizard-steps';

export async function validateStep(
  step: WizardStep,
  formValues: ErrandFormDTO,
  t?: TFunction
): Promise<string[]> {
  switch (step.id) {
    case 'about': {
      const errors: string[] = [];
      const eventType = formValues.parameters?.find((p) => p.key === 'eventType')?.values?.[0];
      const eventConcerns = formValues.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];

      if (!eventType) {
        errors.push(t ? t('errand-information:about.event_type_required') : 'Välj en händelsetyp');
      }
      if (!eventConcerns) {
        errors.push(t ? t('errand-information:about.event_concerns_required') : 'Välj vad händelsen berör');
      }
      return errors;
    }

    case 'deviation': {
      return validateErrandFormData(formValues.errandFormData, t);
    }

    case 'reporter':
    case 'user':
    case 'summary':
    default:
      return [];
  }
}
