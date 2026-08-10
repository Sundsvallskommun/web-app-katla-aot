'use client';

import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { Button, Spinner } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { MobileErrandCard } from './mobile-errand-card.component';

interface MobileErrandsListProps {
  rows: ErrandDTO[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export const MobileErrandsList: React.FC<MobileErrandsListProps> = ({ rows, isLoading, hasMore, loadMore }) => {
  const { t } = useTranslation();

  if (isLoading && rows.length === 0) {
    return (
      <div className="flex justify-center py-40">
        <Spinner />
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="text-center py-40 text-dark-secondary">{t('errand-information:no_errands')}</div>;
  }

  return (
    <div className="flex flex-col gap-8 px-16 pb-24">
      {rows.map((errand, index) => (
        <MobileErrandCard key={`mobile-errand-${index}`} errand={errand} />
      ))}
      {hasMore && (
        <div className="pt-8 pb-16">
          <Button variant="tertiary" color="vattjom" loading={isLoading} onClick={loadMore} className="w-full">
            {t('filtering:load_more')}
          </Button>
        </div>
      )}
    </div>
  );
};
