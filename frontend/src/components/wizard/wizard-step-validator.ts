import { validateErrandFormData } from '@components/json/utils/schema-utils';
import { ErrandFormDTO } from '@interfaces/errand-form';
import { validateErrandAttachments } from '@utils/errand-attachments';
import { getSelectedLabels } from '@utils/label-tree';
import { getPrimaryStakeholder } from '@utils/stakeholder';
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
  locale: string | undefined,
  namespace: string | undefined
): Promise<string[]> {
  switch (step.id) {
    case 'details': {
      return validateErrandFormData(formValues.errandFormData, t, locale);
    }

    case 'attachments': {
      return validateErrandAttachments(formValues, t, locale, namespace);
    }

    case 'owner': {
      return getPrimaryStakeholder(formValues.stakeholders) ? [] : [t('validation:owner.required')];
    }

    case 'about': {
      const { CATEGORY, TYPE } = getSelectedLabels(formValues.labels);
      if (!CATEGORY) return [t('validation:categorization.category_required')];
      return TYPE ? [] : [t('validation:categorization.type_required')];
    }

    case 'other-parties':
    case 'summary':
    default:
      return [];
  }
}
