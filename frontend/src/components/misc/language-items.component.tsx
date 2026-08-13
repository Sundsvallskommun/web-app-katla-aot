'use client';

import { pathWithLocale } from '@app/locale-path';
import { languageOptions } from '@components/misc/language-options';
import { PopupMenu, RadioButton } from '@sk-web-gui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export const LanguageItems = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <PopupMenu.Items aria-label={t('layout:language.label')}>
      {languageOptions.map(({ value, labelKey }) => (
        <PopupMenu.Item key={value} closeOnClick={false}>
          <RadioButton
            name="user-menu-language"
            value={value}
            data-cy={`language-option-${value}`}
            lang={value}
            onChange={() => {
              // Navigera med uttryckligt språkprefix. Proxyn skriver om NEXT_LOCALE-kakan
              // utifrån sökvägen och skalar bort prefixet igen för standardspråket, så
              // valet behöver inte skrivas till kakan här.
              router.push(pathWithLocale(pathname, value));
            }}
            checked={i18n.resolvedLanguage === value}
          >
            <span lang={value}>{t(labelKey)}</span>
          </RadioButton>
        </PopupMenu.Item>
      ))}
    </PopupMenu.Items>
  );
};
