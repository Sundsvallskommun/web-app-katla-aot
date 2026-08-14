import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { acknowledgeNotification, getNotifications } from '@services/errand-service/errand-service';
import { prettyTime } from '@services/helper-service';
import { cx, useSnackbar } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';

import { NotificationRenderIcon } from './notification-render-icon';

export const NotificationItem: React.FC<{ notification: NotificationDTO }> = ({ notification }) => {
  const toastMessage = useSnackbar();
  const { t } = useTranslation();
  const { setNotifications } = useNotificationStore();

  const handleAcknowledge = async () => {
    try {
      await acknowledgeNotification(notification);
    } catch {
      toastMessage({
        position: 'bottom',
        closeable: false,
        message: t('api_errors.acknowledge_notification'),
        status: 'error',
      });
      return;
    }

    try {
      setNotifications(await getNotifications());
    } catch {
      toastMessage({
        position: 'bottom',
        closeable: false,
        message: t('api_errors.notifications'),
        status: 'error',
      });
    }
  };

  // Subtypen är språkneutral och används som nyckel. Saknar den översättning visas ingen
  // händelserad alls, precis som tidigare för okända subtyper.
  const subTypeLabel = t(`notification.subtype.${notification.subtype ?? ''}`, { defaultValue: '' });
  const sender = (notification.createdByFullName ?? '') || notification.createdBy;
  const senderName = !sender || sender.toUpperCase() === 'UNKNOWN' ? t('notification.unknown_sender') : sender;

  return (
    <div className="p-16 flex gap-12 items-start justify-between text-small">
      <div className="flex items-center my-xs">
        <NotificationRenderIcon notification={notification} />
      </div>
      <div className="flex-grow">
        <div>
          <strong>{(notification.description ?? '') + ' › '}</strong>
          <NextLink
            href={`/arende/${notification.errandNumber}/grundinformation`}
            target="_blank"
            onClick={() => {
              void handleAcknowledge();
            }}
            className="underline whitespace-nowrap"
          >
            {(notification.errandNumber ?? '') || t('notification.to_errand')}
          </NextLink>
        </div>
        <div>{t('notification.from', { name: senderName })}</div>
        {subTypeLabel ?
          <div>{t('notification.event', { label: subTypeLabel })}</div>
        : null}
      </div>
      <span className="whitespace-nowrap">{prettyTime(notification.created ?? '', t)}</span>
      {!notification.acknowledged && (
        <div>
          <span
            className={cx(
              `w-12 h-12 my-xs rounded-full flex items-center justify-center text-lg`,
              `bg-vattjom-surface-primary`
            )}
          />
        </div>
      )}
    </div>
  );
};
