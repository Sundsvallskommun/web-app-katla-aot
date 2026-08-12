import { ErrandDTO } from '@data-contracts/backend/data-contracts';

export const getTypeDisplayName = (errand: ErrandDTO) => {
  const hasAdverseIncident = errand.labels?.some((l) => l.resourceName === 'ABUSE');
  return hasAdverseIncident ? 'Missförhållande' : 'Avvikelse';
};
