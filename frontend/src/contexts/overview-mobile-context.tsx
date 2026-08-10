'use client';

import { createContext, useContext } from 'react';

export const OverviewMobileContext = createContext<boolean | undefined>(undefined);

export function useIsOverviewMobile(): boolean {
  const isMobile = useContext(OverviewMobileContext);

  if (isMobile === undefined) {
    throw new Error('useIsOverviewMobile must be used within an OverviewMobileProvider');
  }

  return isMobile;
}
