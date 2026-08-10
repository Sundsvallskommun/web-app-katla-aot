'use client';

import { type PropsWithChildren } from 'react';

import { OverviewMobileContext } from './overview-mobile-context';

export function OverviewMobileProvider({ children, value }: PropsWithChildren<{ value: boolean }>) {
  return <OverviewMobileContext.Provider value={value}>{children}</OverviewMobileContext.Provider>;
}
