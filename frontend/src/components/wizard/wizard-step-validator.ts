import { validateErrandFormData } from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';
import type { TFunction } from 'i18next';

import { WizardStep } from './wizard-steps';

/**
 * `t` är obligatorisk. Med en valfri parameter och svensk reservtext skulle en glömd
 * inkoppling ge svenska valideringsfel i ett engelskt gränssnitt, utan att vare sig
 * typkontroll eller test reagerar.
 */
export async function validateStep(
  step: WizardStep,
  formValues: ErrandFormDTO,
  t: TFunction,
  locale?: string
): Promise<string[]> {
  switch (step.id) {
    case 'about': {
      const errors: string[] = [];
      const eventType = formValues.parameters?.find((p) => p.key === 'eventType')?.values?.[0];
      const eventConcerns = formValues.parameters?.find((p) => p.key === 'eventConcerns')?.values?.[0];

      if (!eventType) {
        errors.push(t('errand-information:about.event_type_required'));
      }
      if (!eventConcerns) {
        errors.push(t('errand-information:about.event_concerns_required'));
      }
      return errors;
    }

    case 'deviation': {
      return validateErrandFormData(formValues.errandFormData, t, locale);
    }

    case 'reporter':
    case 'user':
    case 'summary':
    default:
      return [];
  }
}
