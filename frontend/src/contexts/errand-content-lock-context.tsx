'use client';

import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { createContext, useContext } from 'react';
import { useFormContext } from 'react-hook-form';

export const ErrandContentLockContext = createContext(false);

/**
 * Sant när ärendets status innebär att innehållet inte längre får ändras.
 * Regeln bor här så att den inte hinner glida isär mellan de ytor som behöver
 * känna till den.
 */
export function useErrandLockedByStatus(): boolean {
  const { watch } = useFormContext<ErrandDTO>();
  return watch('status') !== 'DRAFT';
}

/**
 * Sant när komponenten renderas inuti ett låst ErrandContentLock.
 *
 * Komponenter som renderar åtgärder använder den för att utelämna dem helt.
 * Ett inaktiverat fieldset gör knappar oklickbara men lämnar dem synliga, och
 * en knapp som inte svarar läser som att något är trasigt snarare än som att
 * ärendet är låst.
 */
export function useIsContentLocked(): boolean {
  return useContext(ErrandContentLockContext);
}
