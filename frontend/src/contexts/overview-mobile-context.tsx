'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

const OverviewMobileContext = createContext<boolean | undefined>(undefined);

export function OverviewMobileProvider({ children, value }: PropsWithChildren<{ value: boolean }>) {
  return <OverviewMobileContext.Provider value={value}>{children}</OverviewMobileContext.Provider>;
}

export function useIsOverviewMobile(): boolean {
  const isMobile = useContext(OverviewMobileContext);

  if (isMobile === undefined) {
    throw new Error('useIsOverviewMobile must be used within an OverviewMobileProvider');
  }

  return isMobile;
}
