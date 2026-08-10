'use client';

import { FilterOverviewSidebarStatusSelector } from '@components/sidebars/filter-overview-sidebar-status-selector.component';
import { LogoutButton } from '@components/buttons/logout-button.component';
import { MainPageMobileHeader } from './main-page-mobile-header.component';
import { useUserStore } from '@services/user-service/user-service';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Avatar, Button, ColorSchemeMode, Divider, RadioButton } from '@sk-web-gui/react';
import { Monitor, Moon, Sun, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

interface MobileMenuBodyProps {
  onClose: () => void;
}

export const MobileMenuBody: React.FC<MobileMenuBodyProps> = ({ onClose }) => {
  const user = useUserStore(useShallow((s) => s.user));
  const { colorScheme, setColorScheme } = useLocalStorage();

  return (
    <div className="fixed inset-0 z-50 bg-background-content pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <MainPageMobileHeader
        actions={
          <Button iconButton variant="tertiary" aria-label="Stäng meny" onClick={onClose}>
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
            <span className="text-small font-bold">Färgläge</span>
            <div className="flex gap-8">
              <RadioButton value="light" checked={colorScheme === 'light'} onClick={() => setColorScheme(ColorSchemeMode.Light)}>
                <Sun className={colorScheme === 'light' ? '' : 'opacity-50'} size={16} /> Ljust
              </RadioButton>
              <RadioButton value="dark" checked={colorScheme === 'dark'} onClick={() => setColorScheme(ColorSchemeMode.Dark)}>
                <Moon className={colorScheme === 'dark' ? '' : 'opacity-50'} size={16} /> Mörkt
              </RadioButton>
              <RadioButton value="system" checked={colorScheme === 'system'} onClick={() => setColorScheme(ColorSchemeMode.System)}>
                <Monitor className={colorScheme === 'system' ? '' : 'opacity-50'} size={16} /> System
              </RadioButton>
            </div>
          </div>

          <Divider />

          <LogoutButton smallSideBar={false} />
        </div>
      </MainPageMobileHeader>
    </div>
  );
};
