import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import type { TFunction } from 'i18next';

export const getTypeDisplayName = (errand: ErrandDTO, t: TFunction) => {
  const hasAdverseIncident = errand.labels?.some((l) => l.resourceName === 'ABUSE');
  return hasAdverseIncident ?
      t('errand-information:about.event_type_misconduct')
    : t('errand-information:about.event_type_deviation');
};
