'use client';

import { LogoutButton } from '@components/buttons/logout-button.component';
import { FilterOverviewSidebarStatusSelector } from '@components/sidebars/filter-overview-sidebar-status-selector.component';
import { useUserStore } from '@services/user-service/user-service';
import { Avatar, Button, ColorSchemeMode, Divider, RadioButton } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Monitor, Moon, Sun, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { MainPageMobileHeader } from './main-page-mobile-header.component';

interface MobileMenuBodyProps {
  onClose: () => void;
}

export const MobileMenuBody: React.FC<MobileMenuBodyProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const user = useUserStore(useShallow((s) => s.user));
  const { colorScheme, setColorScheme } = useLocalStorage();

  return (
    <section
      id="mobile-overview-menu"
      aria-label={t('filtering:menu_title')}
      className="fixed inset-0 z-50 bg-background-content pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <MainPageMobileHeader
        actions={
          <Button iconButton variant="tertiary" aria-label={t('layout:controls.close_menu')} onClick={onClose}>
            <X />
          </Button>
        }
      >
        <div className="flex flex-col gap-16 px-24 py-16">
          <div className="flex items-center gap-12">
            <Avatar initials={user.initials} size="md" />
            <div className="flex flex-col">
              <span className="font-bold text-base">{user.name}</span>
              <span className="text-small text-dark-secondary">{user.username}</span>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-8">
            <FilterOverviewSidebarStatusSelector smallSideBar={false} />
          </div>

          <Divider />

          <div className="flex flex-col gap-8">
            <span id="mobile-color-scheme-label" className="text-small font-bold">
              {t('layout:color_scheme.label')}
            </span>
            <RadioButton.Group
              aria-labelledby="mobile-color-scheme-label"
              className="flex gap-8"
              name="mobile-color-scheme"
              value={colorScheme}
            >
              <RadioButton
                value="light"
                checked={colorScheme === ColorSchemeMode.Light}
                onChange={() => {
                  setColorScheme(ColorSchemeMode.Light);
                }}
              >
                <Sun
                  aria-hidden="true"
                  className={colorScheme === ColorSchemeMode.Light ? '' : 'opacity-50'}
                  size={16}
                />{' '}
                {t('layout:color_scheme.light')}
              </RadioButton>
              <RadioButton
                value="dark"
                checked={colorScheme === ColorSchemeMode.Dark}
                onChange={() => {
                  setColorScheme(ColorSchemeMode.Dark);
                }}
              >
                <Moon
                  aria-hidden="true"
                  className={colorScheme === ColorSchemeMode.Dark ? '' : 'opacity-50'}
                  size={16}
                />{' '}
                {t('layout:color_scheme.dark')}
              </RadioButton>
              <RadioButton
                value="system"
                checked={colorScheme === ColorSchemeMode.System}
                onChange={() => {
                  setColorScheme(ColorSchemeMode.System);
                }}
              >
                <Monitor
                  aria-hidden="true"
                  className={colorScheme === ColorSchemeMode.System ? '' : 'opacity-50'}
                  size={16}
                />{' '}
                {t('layout:color_scheme.system')}
              </RadioButton>
            </RadioButton.Group>
          </div>

          <Divider />

          <LogoutButton smallSideBar={false} />
        </div>
      </MainPageMobileHeader>
    </section>
  );
};
