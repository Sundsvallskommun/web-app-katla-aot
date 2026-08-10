import '@styles/tailwind.scss';

import AppLayout from '@layouts/app/app-layout.component';
import { ReactNode, Suspense } from 'react';

import i18nConfig from './i18nConfig';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang={i18nConfig.defaultLocale}>
      <body>
        <Suspense>
          <AppLayout>{children}</AppLayout>
        </Suspense>
      </body>
    </html>
  );
};

export default RootLayout;
