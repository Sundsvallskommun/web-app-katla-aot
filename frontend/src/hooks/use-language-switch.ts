'use client';

import i18nConfig from '@app/i18nConfig';
import { pathWithLocale } from '@app/locale-path';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitch {
  currentLanguage: string;
  switchTo: (locale: string) => void;
}

/**
 * Språkbytet som en enda källa, delad av alla ytor som exponerar valet. Utan den låg
 * navigeringen kopierad i varje meny, och en yta som glömde en detalj – som frågesträngen –
 * blev tyst trasig först när någon använde just den menyn.
 */
export const useLanguageSwitch = (): LanguageSwitch => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLanguage = i18n.resolvedLanguage ?? i18nConfig.defaultLocale;

  const switchTo = useCallback(
    (locale: string) => {
      // Frågesträngen bär tillstånd som sidan inte kan återskapa: inloggningen läser
      // ?path för vart användaren ska tillbaka och ?failMessage för felet som ska visas.
      // Ett språkbyte som tappar den skickar användaren till översikten i stället för
      // till sidan hen försökte nå.
      const query = searchParams.toString();

      // Navigera med uttryckligt språkprefix. Proxyn skriver om NEXT_LOCALE-kakan utifrån
      // sökvägen och skalar bort prefixet igen för standardspråket, så valet behöver inte
      // skrivas till kakan här.
      router.push(`${pathWithLocale(pathname, locale)}${query ? `?${query}` : ''}`);
    },
    [pathname, router, searchParams]
  );

  return { currentLanguage, switchTo };
};
