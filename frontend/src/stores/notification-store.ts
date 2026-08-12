import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { sortBy } from 'lodash';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationState {
  activeNotifications: NotificationDTO[];
  acknowledgedNotifications: NotificationDTO[];
  setNotifications: (notifications: NotificationDTO[]) => void;
}

const newestFirst = (notifications: NotificationDTO[]): NotificationDTO[] => sortBy(notifications, 'created').reverse();

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      activeNotifications: [],
      acknowledgedNotifications: [],
      setNotifications: (notifications) =>
        set({
          activeNotifications: newestFirst(notifications.filter((notification) => !notification.acknowledged)),
          acknowledgedNotifications: newestFirst(notifications.filter((notification) => notification.acknowledged)),
        }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
