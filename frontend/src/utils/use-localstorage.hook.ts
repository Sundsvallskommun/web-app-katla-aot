import 'dotenv';

import { LocalStorage } from '@interfaces/localstorage';
import { ColorSchemeMode } from '@sk-web-gui/react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useLocalStorage = create(
  persist<LocalStorage>(
    (set) => ({
      colorScheme: ColorSchemeMode.System,
      setColorScheme: (colorScheme) => set(() => ({ colorScheme })),
    }),
    {
      name: `${process.env.NEXT_PUBLIC_APP_NAME}-localstorage-store`,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
