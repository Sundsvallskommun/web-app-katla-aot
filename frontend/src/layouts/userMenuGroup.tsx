import { LogoutButton } from '@components/buttons/logout-button.component';
import { ColorSchemeItems } from '@components/misc/color-scheme-items.component';
import { PopupMenu } from '@sk-web-gui/react';
import { ChevronRight, Monitor } from 'lucide-react';

export const userMenuGroups = [
  {
    label: 'Annat',
    showLabel: false,
    showOnDesktop: true,
    showOnMobile: true,
    elements: [
      {
        label: 'Färgläge',
        element: () => (
          <PopupMenu.Item>
            <PopupMenu position="right" align="start">
              <PopupMenu.Button className="justify-between w-full">
                <Monitor />
                <span className="w-full flex justify-between">
                  Färgläge
                  <ChevronRight />
                </span>
              </PopupMenu.Button>
              <PopupMenu.Panel>
                <ColorSchemeItems />
              </PopupMenu.Panel>
            </PopupMenu>
          </PopupMenu.Item>
        ),
      },
      {
        label: 'Logga ut',
        element: () => (
          <PopupMenu.Item>
            <LogoutButton testId="user-menu-logout-button" />
          </PopupMenu.Item>
        ),
      },
    ],
  },
];
