'use client';

import initLocalization from '@app/i18n';
import { createInstance, Resource } from 'i18next';
import { memo, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

interface LocalizationProviderProps {
  children: ReactNode;
  locale: string;
  namespaces: string[];
  resources: Resource;
}

const LocalizationProvider = memo<LocalizationProviderProps>(({ children, locale, namespaces, resources }) => {
  const i18n = createInstance();

  void initLocalization(locale, namespaces, i18n, resources);

  return <I18nextProvider {...{ i18n }}>{children}</I18nextProvider>;
});

LocalizationProvider.displayName = 'LocalizationProvider';
export default LocalizationProvider;
