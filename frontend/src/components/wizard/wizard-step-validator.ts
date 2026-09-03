import { validateErrandFormData } from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';
import type { TFunction } from 'i18next';

import { WizardStep } from './wizard-steps';

/**
 * `t` is required. With an optional parameter and a Swedish fallback, a forgotten wire-up would
 * give Swedish validation errors in an English interface without the type checker or a test
 * reacting.
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
