import { Badge, Button } from '@sk-web-gui/react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from 'src/stores/notification-store';

export const NotificationsBell = (props: { toggleShow: () => void }) => {
  const { activeNotifications } = useNotificationStore();

  return (
    <Button
      role="menuitem"
      size={'md'}
      aria-label={'Notifieringar'}
      onClick={() => {
        props.toggleShow();
      }}
      className="mx-md"
      variant="tertiary"
      iconButton
      leftIcon={<Bell />}
    >
      {activeNotifications.length > 0 && (
        <Badge
          className="absolute -top-10 -right-10 text-white"
          rounded
          color="vattjom"
          counter={activeNotifications.length > 99 ? '99+' : activeNotifications.length}
        />
      )}
    </Button>
  );
};
