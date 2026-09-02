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
    case 'details': {
      return validateErrandFormData(formValues.errandFormData, t, locale);
    }

    case 'about':
    case 'owner':
    case 'other-parties':
    case 'summary':
    default:
      return [];
  }
}
