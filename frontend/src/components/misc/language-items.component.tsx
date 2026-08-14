'use client';

import { languageOptions } from '@components/misc/language-options';
import { PopupMenu, RadioButton } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitch } from 'src/hooks/use-language-switch';

interface LanguageItemsProps {
  /**
   * Radiogruppens namn. Två grupper med samma namn på samma sida delar markering, och sedan
   * språkvalet finns både i användarmenyn och som egen knapp i sidhuvudet renderas listan
   * mer än en gång – varje plats måste därför bära ett eget namn.
   */
  name?: string;
  /** Prefix för data-cy, av samma skäl som `name`: selektorerna måste vara unika per yta. */
  testIdPrefix?: string;
  /**
   * Körs precis före navigeringen, för sidor som har tillstånd att rädda undan. Språkbytet
   * monterar om trädet, så det som bara ligger i minnet är borta efter det.
   */
  onBeforeSwitch?: () => void;
}

export const LanguageItems: React.FC<LanguageItemsProps> = ({
  name = 'user-menu-language',
  testIdPrefix = 'language-option',
  onBeforeSwitch,
}) => {
  const { t } = useTranslation();
  const { currentLanguage, switchTo } = useLanguageSwitch();

  return (
    <PopupMenu.Items aria-label={t('layout:language.label')}>
      {languageOptions.map(({ value, labelKey }) => (
        <PopupMenu.Item key={value} closeOnClick={false}>
          <RadioButton
            name={name}
            value={value}
            data-cy={`${testIdPrefix}-${value}`}
            lang={value}
            onChange={() => {
              onBeforeSwitch?.();
              switchTo(value);
            }}
            checked={currentLanguage === value}
          >
            <span lang={value}>{t(labelKey)}</span>
          </RadioButton>
        </PopupMenu.Item>
      ))}
    </PopupMenu.Items>
  );
};
