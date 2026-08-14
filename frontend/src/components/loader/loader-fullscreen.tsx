'use client';

import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import { Spinner } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

export default function LoaderFullScreen() {
  const { t } = useTranslation();

  return (
    <EmptyLayout>
      <main>
        <div className="w-screen h-screen flex place-items-center place-content-center">
          <Spinner size={12} aria-label={t('common:loading_information')} />
        </div>
      </main>
    </EmptyLayout>
  );
}
