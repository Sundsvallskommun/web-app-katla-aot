'use client';

// Sidoeffekt: registrerar dayjs-plugins och locale-data högst upp i trädet, innan någon
// vy hinner formatera ett datum. Själva språkvalet sätts av LocalizationProvider.
import '@utils/dayjs-locale';

import { useUserStore } from '@services/user-service/user-service';
import { GuiProvider } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { ReactNode, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface ClientApplicationProps {
  children: ReactNode;
}

const AppLayout = ({ children }: ClientApplicationProps) => {
  const colorScheme = useLocalStorage(useShallow((state) => state.colorScheme));
  const getMe = useUserStore((state) => state.getMe);

  useEffect(() => {
    void getMe();
  }, [getMe]);

  return (
    <GuiProvider colorScheme={colorScheme}>
      {children}
      {/* <InactivityMonitor /> */}
    </GuiProvider>
  );
};

export default AppLayout;
