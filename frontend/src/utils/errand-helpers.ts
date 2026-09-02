import { ErrandDTO } from '@data-contracts/backend/data-contracts';

/**
 * Ärendetypen visas i översikten. Den låg tidigare i ABUSE-etiketten; för AoT är det
 * klassificeringens typ som gäller, och den sätts först när ärendetypsvalet finns.
 */
export const getTypeDisplayName = (errand: ErrandDTO) => errand.classification?.type ?? '—';
