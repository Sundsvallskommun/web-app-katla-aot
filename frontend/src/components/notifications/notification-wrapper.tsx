'use client';

import { ErrorAlert } from '@components/misc/error-alert.component';
import { MainPageMobileHeader } from '@components/mobile/main-page-mobile-header.component';
import { getNotifications } from '@services/errand-service/errand-service';
import { Button, cx, Divider, Header, Spinner } from '@sk-web-gui/react';
import { Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';
import { useNotificationStore } from 'src/stores/notification-store';

import { NotificationItem } from './notification-item';

export const NotificationsWrapper: React.FC<{ show: boolean; setShow: (arg0: boolean) => void; open?: boolean }> = ({
  show,
  setShow,
  open = false,
}) => {
  const { t } = useTranslation();
  const { activeNotifications, acknowledgedNotifications, setNotifications } = useNotificationStore();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void getNotifications()
      .then((notifications) => {
        if (!active) return;
        setNotifications(notifications);
        setError(null);
      })
      .catch(() => {
        if (active) setError(t('api_errors.notifications'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [setNotifications, show, t]);

  const hasNotifications = activeNotifications.length > 0 || acknowledgedNotifications.length > 0;

  const notificationContent = (
    <div className="flex-grow mt-sm mb-0 p-24 pt-0 flex flex-col gap-24 overflow-auto">
      {error && <ErrorAlert message={error} />}
      {isLoading && !hasNotifications && !error ?
        <div className="flex justify-center p-24">
          <Spinner aria-label={t('layout:notifications.loading')} />
        </div>
      : <>
          <div className="flex flex-col gap-4">
            <Divider.Section>
              <div className="flex gap-sm items-center">
                <h2 className="text-h4-sm">{t('layout:notifications.new')}</h2>
              </div>
            </Divider.Section>
            {activeNotifications.length > 0 ?
              <ul>
                {activeNotifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
                  </li>
                ))}
              </ul>
            : !error && !isLoading ?
              <div className="m-md">{t('layout:notifications.none_new')}</div>
            : null}
          </div>
          <div>
            <Divider.Section>
              <div className="flex gap-sm items-center">
                <h2 className="text-h4-sm">{t('layout:notifications.previous')}</h2>
              </div>
            </Divider.Section>
            {acknowledgedNotifications.length > 0 ?
              <ul>
                {acknowledgedNotifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} />
                  </li>
                ))}
              </ul>
            : !error && !isLoading ?
              <div className="m-md">{t('layout:notifications.none_previous')}</div>
            : null}
          </div>
        </>
      }
    </div>
  );

  if (!show) return null;

  if (isMobile) {
    return (
      <section
        id="notifications-panel"
        aria-label={t('layout:notifications.panel')}
        className="fixed inset-0 z-50 bg-background-content pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <MainPageMobileHeader
          actions={
            <Button
              aria-label={t('layout:notifications.close')}
              iconButton
              variant="tertiary"
              onClick={() => {
                setShow(false);
              }}
              data-cy="close-message-wrapper"
            >
              <X data-cy="close-message-wrapper-icon" />
            </Button>
          }
        >
          {notificationContent}
        </MainPageMobileHeader>
      </section>
    );
  }

  return (
    <>
      <div
        className={cx(
          'sk-modal-wrapper',
          open ? 'left-[32rem] w-[calc(100vw-32rem)]' : 'left-[5.6rem] w-[calc(100vw-5.6rem)]'
        )}
      ></div>
      <section
        id="notifications-panel"
        aria-label={t('layout:notifications.panel')}
        className={cx(
          open ? 'left-[32rem]' : 'left-[5.6rem]',
          `border-1 border-t-0 absolute bottom-0 top-0 bg-background-content transition-all ease-in-out duration-150 overflow-auto z-[20] shadow-100`,
          'w-full md:min-w-[50rem] md:w-[50vw] lg:w-[38vw]'
        )}
      >
        <Header className="h-[64px] flex justify-between" wrapperClasses="py-4 px-40">
          <div className="text-h4-sm flex items-center gap-12">
            <Mail aria-hidden="true" /> {t('layout:notifications.panel')}
          </div>
          <Button
            tabIndex={0}
            aria-label={t('layout:notifications.close')}
            iconButton
            variant="tertiary"
            onClick={() => {
              setShow(false);
            }}
            data-cy="close-message-wrapper"
          >
            <X data-cy="close-message-wrapper-icon" />
          </Button>
        </Header>
        {notificationContent}
      </section>
    </>
  );
};
