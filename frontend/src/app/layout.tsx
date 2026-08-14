import '@styles/tailwind.scss';

import AppLayout from '@layouts/app/app-layout.component';
import { headers } from 'next/headers';
import { ReactNode, Suspense } from 'react';

import { localeFromPath } from './locale-path';

const RootLayout = async ({ children }: { children: ReactNode }) => {
  // Rot-layouten ligger ovanför [locale] och har därför ingen locale-parameter. Proxyn
  // sätter x-path på requesten, så språket härleds från sökvägens första segment i
  // stället för att låsas till standardspråket – annars skulle engelska sidor felaktigt
  // deklarera lang="sv" för skärmläsare.
  const locale = localeFromPath((await headers()).get('x-path'));

  return (
    <html lang={locale}>
      <body>
        <Suspense>
          <AppLayout>{children}</AppLayout>
        </Suspense>
      </body>
    </html>
  );
};

export default RootLayout;
