'use client';

import { NotificationsBell } from '@components/notifications/notification-bell';
import { NotificationsWrapper } from '@components/notifications/notification-wrapper';
import { Button } from '@sk-web-gui/react';
import { Menu } from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterStore } from 'src/stores/filter-store';
import { useOverviewErrands } from 'src/hooks/use-overview-errands';
import { capitalize } from 'lodash';
import { MainPageMobileHeader } from './main-page-mobile-header.component';
import { MobileErrandsList } from './mobile-errands-list.component';
import { MobileMenuBody } from './mobile-menu-body.component';

type OverlayType = 'menu' | null;

export const MobileOverviewLayout: React.FC = () => {
  const { t } = useTranslation();
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { activeStatus } = useFilterStore();
  const { rows, isLoading, hasMore, loadMore, totalElements } = useOverviewErrands({ mode: 'mobile' });

  const statusLabel = activeStatus ? capitalize(activeStatus) : capitalize(t('filtering:errands.open'));

  return (
    <>
      <MainPageMobileHeader
        actions={
          <div className="flex items-center gap-12">
            <div className="[&>button]:!mx-0">
              <NotificationsBell toggleShow={() => setShowNotifications(!showNotifications)} />
            </div>
            <Button iconButton variant="tertiary" aria-label="Meny" onClick={() => setOverlay('menu')}>
              <Menu />
            </Button>
          </div>
        }
      >
        <div className="px-24 py-12">
          <NextLink href="/arende/registrera" className="no-underline w-full block">
            <Button color="vattjom" variant="primary" className="w-full">
              {t('filtering:new_errand_mobile')}
            </Button>
          </NextLink>
        </div>

        <div className="px-24 pt-8 pb-12">
          <h2 className="text-h3-md">{statusLabel}</h2>
          {rows.length < totalElements && (
            <span className="text-small text-dark-secondary">
              Visar {rows.length} av {totalElements} {activeStatus ? activeStatus : t('filtering:errands.open')}
            </span>
          )}
        </div>

        <MobileErrandsList rows={rows} isLoading={isLoading} hasMore={hasMore} loadMore={loadMore} />
      </MainPageMobileHeader>

      {overlay === 'menu' && <MobileMenuBody onClose={() => setOverlay(null)} />}

      <NotificationsWrapper show={showNotifications} setShow={setShowNotifications} open={false} />
    </>
  );
};
