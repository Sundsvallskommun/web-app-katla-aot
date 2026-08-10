'use client';

import { MainPageMobileHeader } from '@components/mobile/main-page-mobile-header.component';
import { getNotifications } from '@services/errand-service/errand-service';
import { Mail, X } from 'lucide-react';
import { Button, cx, Divider, Header } from '@sk-web-gui/react';
import { sortBy } from 'lodash';
import { useEffect } from 'react';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';
import { useNotificationStore } from 'src/stores/notification-store';
import { NotificationItem } from './notification-item';

export const NotificationsWrapper: React.FC<{ show: boolean; setShow: (arg0: boolean) => void; open?: boolean }> = ({
  show,
  setShow,
  open = false,
}) => {
  const { activeNotifications, setActiveNotifications, acknowledgedNotifications, setAcknowledgedNotifications } =
    useNotificationStore();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  useEffect(() => {
    getNotifications().then((res) => {
      setActiveNotifications(
        sortBy(
          res.filter((n) => !n.acknowledged),
          'created'
        ).reverse()
      );

      setAcknowledgedNotifications(
        sortBy(
          res.filter((n) => n.acknowledged),
          'created'
        ).reverse()
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background-content pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <MainPageMobileHeader
          actions={
            <Button
              aria-label="Stäng notiser"
              iconButton
              variant="tertiary"
              onClick={() => setShow(false)}
              data-cy="close-message-wrapper"
            >
              <X data-cy="close-message-wrapper-icon" />
            </Button>
          }
        >
          <div className="flex-grow p-24 flex flex-col gap-24 overflow-auto">
            <div className="flex flex-col gap-4">
              <Divider.Section>
                <div className="flex gap-sm items-center">
                  <h2 className="text-h4-sm">Nya</h2>
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
              : <div className="m-md">Inga nya notifieringar</div>}
            </div>
            <div>
              <Divider.Section>
                <div className="flex gap-sm items-center">
                  <h2 className="text-h4-sm">Tidigare</h2>
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
              : <div className="m-md">Inga notifieringar</div>}
            </div>
          </div>
        </MainPageMobileHeader>
      </div>
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
        className={cx(
          open ? 'left-[32rem]' : 'left-[5.6rem]',
          `border-1 border-t-0 absolute bottom-0 top-0 bg-background-content transition-all ease-in-out duration-150 overflow-auto z-[20] shadow-100`,
          'w-full md:min-w-[50rem] md:w-[50vw] lg:w-[38vw]'
        )}
      >
        <Header className="h-[64px] flex justify-between" wrapperClasses="py-4 px-40">
          <div className="text-h4-sm flex items-center gap-12">
            <Mail /> Notiser
          </div>
          <Button
            tabIndex={0}
            aria-label="Stäng notiser"
            iconButton
            variant="tertiary"
            onClick={() => setShow(false)}
            data-cy="close-message-wrapper"
          >
            <X data-cy="close-message-wrapper-icon" />
          </Button>
        </Header>
        <div className="flex-grow mt-sm mb-0 p-24 pt-0 flex flex-col gap-24 overflow-auto">
          <div className="flex flex-col gap-4">
            <Divider.Section>
              <div className="flex gap-sm items-center">
                <h2 className="text-h4-sm">Nya</h2>
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
            : <div className="m-md">Inga nya notifieringar</div>}
          </div>
          <div>
            <Divider.Section>
              <div className="flex gap-sm items-center">
                <h2 className="text-h4-sm">Tidigare</h2>
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
            : <div className="m-md">Inga notifieringar</div>}
          </div>
        </div>
      </section>
    </>
  );
};
