import { ErrandDTO } from '@data-contracts/backend/data-contracts';

/**
 * The errand type shown in the overview. It comes from the classification, which is only set
 * once the errand type selection exists.
 */
export const getTypeDisplayName = (errand: ErrandDTO) => errand.classification?.type ?? '—';
