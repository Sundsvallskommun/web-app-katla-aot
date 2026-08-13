import { LogoutButton } from '@components/buttons/logout-button.component';
import { ColorSchemeItems } from '@components/misc/color-scheme-items.component';
import type { MenuItemGroup } from '@sk-web-gui/react';
import { PopupMenu } from '@sk-web-gui/react';
import type { TFunction } from 'i18next';
import { ChevronRight, Monitor } from 'lucide-react';

export const createUserMenuGroups = (t: TFunction): MenuItemGroup[] => [
  {
    label: t('layout:controls.open_user_menu'),
    elements: [
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
