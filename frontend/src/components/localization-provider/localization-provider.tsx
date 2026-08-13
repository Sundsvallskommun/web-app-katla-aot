'use client';

import initLocalization from '@app/i18n';
import { setDayjsLocale } from '@utils/dayjs-locale';
import { createInstance, Resource } from 'i18next';
import { memo, ReactNode, useEffect } from 'react';
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

  // dayjs locale är en processglobal. Sätts den under render delas den mellan samtidiga
  // SSR-requests, så en engelsk begäran kan slå om språket mitt i renderingen av en
  // svensk. I en effekt körs den bara på klienten, där globalen tillhör en enda användare.
  useEffect(() => {
    setDayjsLocale(locale);
  }, [locale]);

  return <I18nextProvider {...{ i18n }}>{children}</I18nextProvider>;
});

LocalizationProvider.displayName = 'LocalizationProvider';
export default LocalizationProvider;
