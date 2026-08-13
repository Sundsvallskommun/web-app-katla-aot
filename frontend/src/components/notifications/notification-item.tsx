import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { acknowledgeNotification, getNotifications } from '@services/errand-service/errand-service';
import { prettyTime } from '@services/helper-service';
import { cx, useSnackbar } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';

import { NotificationRenderIcon } from './notification-render-icon';

const labelBySubType: Record<string, string> = {
  ATTACHMENT: 'Ny bilaga',
  DECISION: 'Nytt beslut',
  ERRAND: 'Ärende uppdaterat',
  MESSAGE: 'Nytt meddelande',
  NOTE: 'Ny kommentar/anteckning',
  SYSTEM: 'Fasbyte',
  SUSPENSION: 'Parkering upphört',
};

const senderFallback = (name?: string): string => {
  if (!name || name.toUpperCase() === 'UNKNOWN') return 'Okänd';
  return name;
};

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

  const subTypeLabel = labelBySubType[notification.subtype ?? ''];

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
            {(notification.errandNumber ?? '') || 'Till ärendet'}
          </NextLink>
        </div>
        <div>Från: {senderFallback((notification.createdByFullName ?? '') || notification.createdBy)}</div>
        {subTypeLabel ?
          <div>Händelse: {subTypeLabel}</div>
        : null}
      </div>
      <span className="whitespace-nowrap">{prettyTime(notification.created ?? '')}</span>
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
