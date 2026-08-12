import { Badge, Button } from '@sk-web-gui/react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from 'src/stores/notification-store';

interface NotificationsBellProps {
  expanded: boolean;
  toggleShow: () => void;
}

export const NotificationsBell = ({ expanded, toggleShow }: NotificationsBellProps) => {
  const { t } = useTranslation();
  const { activeNotifications } = useNotificationStore();
  const notificationCount = activeNotifications.length;
  const accessibleName =
    notificationCount > 0 ?
      t('layout:notifications.open_with_count', { count: notificationCount })
    : t('layout:notifications.open');

  return (
    <Button
      size="md"
      aria-label={accessibleName}
      aria-controls="notifications-panel"
      aria-expanded={expanded}
      onClick={toggleShow}
      className="mx-md"
      variant="tertiary"
      iconButton
      leftIcon={<Bell aria-hidden="true" />}
    >
      {notificationCount > 0 && (
        <Badge
          aria-hidden="true"
          className="absolute -top-10 -right-10 text-white"
          rounded
          color="vattjom"
          counter={notificationCount > 99 ? '99+' : notificationCount}
        />
      )}
    </Button>
  );
};
