'use client';

import { Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { ALCOHOL_PERMIT_SERVICE_PATH } from 'src/constants/routes';

export const StartContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-32 w-full px-16 md:px-40">
      <div className="flex flex-col gap-8">
        <h1 className="text-h2-sm lg:text-h2-lg m-0">{t('start:title')}</h1>
        <p className="m-0">{t('start:intro')}</p>
      </div>
      <ul className="list-none m-0 p-0 flex flex-col gap-24">
        <li className="flex flex-col gap-4">
          <Link
            as={NextLink}
            href={ALCOHOL_PERMIT_SERVICE_PATH}
            size="lg"
            strong
            data-cy="service-link-alkoholtillstand"
          >
            {t('start:services.alkoholtillstand.title')}
          </Link>
          <p className="m-0">{t('start:services.alkoholtillstand.description')}</p>
        </li>
      </ul>
    </div>
  );
};
