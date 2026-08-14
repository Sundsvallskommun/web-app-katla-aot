'use client';

import { LanguageItems } from '@components/misc/language-items.component';
import { PopupMenu } from '@sk-web-gui/react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitch } from 'src/hooks/use-language-switch';

/**
 * Språkvalet som egen kontroll i sidhuvudet. Menyn under användaravataren räcker inte:
 * den är dold på smal skärm, och under registreringen finns ingen meny alls. Språket gick
 * därför bara att byta genom att lämna sidan man höll på att fylla i.
 *
 * Knappen visar det valda språkets kod, medan det tillgängliga namnet skriver ut språket –
 * en kod säger inget för den som inte redan känner igen den.
 */
interface LanguageSwitchButtonProps {
  /** Se `LanguageItems`: sidor med tillstånd i minnet får rädda undan det före navigeringen. */
  onBeforeSwitch?: () => void;
}

export const LanguageSwitchButton: React.FC<LanguageSwitchButtonProps> = ({ onBeforeSwitch }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguageSwitch();

  return (
    // Designsystemet ger panelen `position: absolute` och enbart `right: 0` – den vertikala
    // placeringen kommer från panelens statiska position, alltså där den hade hamnat i
    // normalflödet efter knappen. Omslutningen måste därför vara ett vanligt block: i en
    // flex-container med `items-center` centreras den statiska positionen på knappen i
    // stället, och panelen lägger sig över sidhuvudet. `relative` gör dessutom att
    // `right: 0` mäts mot knappen och inte mot hela raden i sidhuvudet.
    <div className="relative">
      <PopupMenu align="end">
        <PopupMenu.Button
          variant="tertiary"
          size="sm"
          showBackground={false}
          data-cy="language-switch-button"
          aria-label={t('layout:language.switch', { language: t(`layout:language.${currentLanguage}`) })}
          leftIcon={<Languages aria-hidden="true" size={18} />}
        >
          <span aria-hidden="true">{currentLanguage.toLocaleUpperCase(currentLanguage)}</span>
        </PopupMenu.Button>
        <PopupMenu.Panel>
          <LanguageItems name="header-language" testIdPrefix="header-language-option" onBeforeSwitch={onBeforeSwitch} />
        </PopupMenu.Panel>
      </PopupMenu>
    </div>
  );
};
