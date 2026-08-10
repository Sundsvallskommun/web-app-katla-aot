'use client';

import { ErrandFilterQuery } from '@components/filtering/errand-filter-query.component';
import Filtering from '@components/filtering/filtering.component';
import { Button, Link } from '@sk-web-gui/react';
import { ListFilter } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { appConfig } from 'src/config/appconfig';

export const ErrandFilter: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(false);

  return (
    <>
      <div className="w-full flex gap-16 max-w-screen-desktop-max items-center">
        <ErrandFilterQuery />
        {appConfig.features.errandFilter && (
          <Button
            onClick={() => {
              setShow(!show);
            }}
            data-cy="Show-filters-button"
            color="vattjom"
            variant={show ? 'tertiary' : 'primary'}
            inverted={show ? false : true}
            leftIcon={<ListFilter size="1.8rem" />}
          >
            {show ? t('filtering:hide_filter') : t('filtering:show_filter')}
          </Button>
        )}
        <Link href={`${process.env.NEXT_PUBLIC_BASE_PATH}/arende/registrera`} data-cy="register-new-errand-button">
          <Button color={'vattjom'} variant={'primary'}>
            {t('filtering:new_errand')}
          </Button>
        </Link>
      </div>

      {show && <Filtering />}
    </>
  );
};
