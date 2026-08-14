import { LogoutButton } from '@components/buttons/logout-button.component';
import { ColorSchemeItems } from '@components/misc/color-scheme-items.component';
import { LanguageItems } from '@components/misc/language-items.component';
import type { MenuItemGroup } from '@sk-web-gui/react';
import { PopupMenu } from '@sk-web-gui/react';
import type { TFunction } from 'i18next';
import { ChevronRight, Languages, Monitor } from 'lucide-react';

interface UserMenuOptions {
  /**
   * Språkvalet finns både här och som egen knapp i sidhuvudet. Båda navigerar, så båda
   * måste ge sidan samma chans att rädda undan det som bara ligger i minnet.
   */
  onBeforeLanguageSwitch?: () => void;
}

export const createUserMenuGroups = (t: TFunction, options: UserMenuOptions = {}): MenuItemGroup[] => [
  {
    label: t('layout:controls.open_user_menu'),
    elements: [
      {
        label: t('layout:language.label'),
        element: () => (
          <PopupMenu position="right" align="start">
            <PopupMenu.Button className="justify-between w-full" data-cy="language-menu-button">
              <Languages aria-hidden="true" />
              <span className="w-full flex justify-between">
                {t('layout:language.label')}
                <ChevronRight aria-hidden="true" />
              </span>
            </PopupMenu.Button>
            <PopupMenu.Panel>
              <LanguageItems onBeforeSwitch={options.onBeforeLanguageSwitch} />
            </PopupMenu.Panel>
          </PopupMenu>
        ),
      },
      {
        label: t('layout:color_scheme.label'),
        element: () => (
          <PopupMenu position="right" align="start">
            <PopupMenu.Button className="justify-between w-full">
              <Monitor aria-hidden="true" />
              <span className="w-full flex justify-between">
                {t('layout:color_scheme.label')}
                <ChevronRight aria-hidden="true" />
              </span>
            </PopupMenu.Button>
            <PopupMenu.Panel>
              <ColorSchemeItems />
            </PopupMenu.Panel>
          </PopupMenu>
        ),
      },
      {
        label: t('common:logout'),
        element: () => <LogoutButton testId="user-menu-logout-button" />,
      },
    ],
  },
];
