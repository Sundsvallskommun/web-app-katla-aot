import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { acknowledgeNotification, getNotifications } from '@services/errand-service/errand-service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NotificationItem } from 'src/components/notifications/notification-item';
import { NotificationsWrapper } from 'src/components/notifications/notification-wrapper';
import { useNotificationStore } from 'src/stores/notification-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  acknowledgeNotification: vi.fn(),
  getNotifications: vi.fn(),
  snackbar: vi.fn(),
}));

vi.mock('@services/errand-service/errand-service', () => ({
  acknowledgeNotification: mocks.acknowledgeNotification,
  getNotifications: mocks.getNotifications,
}));

vi.mock('src/hooks/use-media-query', () => ({
  useMediaQuery: () => false,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@sk-web-gui/react', async (importOriginal) => {
  const original = await importOriginal<typeof import('@sk-web-gui/react')>();
  return { ...original, useSnackbar: () => mocks.snackbar };
});

const acknowledgeNotificationMock = vi.mocked(acknowledgeNotification);
const getNotificationsMock = vi.mocked(getNotifications);

const activeNotification: NotificationDTO = {
  id: 'notification-id',
  acknowledged: false,
  created: '2026-08-12T08:00:00Z',
  description: 'Ärende uppdaterat',
  errandNumber: 'ERRAND-1',
};

beforeEach(() => {
  useNotificationStore.setState({ activeNotifications: [], acknowledgedNotifications: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('notification API error state', () => {
  it('keeps stored notifications visible and does not render a false empty state', async () => {
    useNotificationStore.getState().setNotifications([activeNotification]);
    getNotificationsMock.mockRejectedValue(new Error('notifications unavailable'));

    render(<NotificationsWrapper show setShow={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('api_errors.notifications');
    expect(screen.getByText('ERRAND-1')).toBeInTheDocument();
    expect(screen.queryByText('Inga nya notifieringar')).not.toBeInTheDocument();
    expect(screen.queryByText('Inga notifieringar')).not.toBeInTheDocument();
    expect(useNotificationStore.getState().activeNotifications).toEqual([activeNotification]);
  });

  it('handles a failed refresh after acknowledgement without clearing notifications', async () => {
    useNotificationStore.getState().setNotifications([activeNotification]);
    acknowledgeNotificationMock.mockResolvedValue(true);
    getNotificationsMock.mockRejectedValue(new Error('refresh unavailable'));

    render(<NotificationItem notification={activeNotification} />);
    fireEvent.click(screen.getByRole('link', { name: 'ERRAND-1' }));

    await waitFor(() => {
      expect(mocks.snackbar).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'api_errors.notifications', status: 'error' })
      );
    });
    expect(useNotificationStore.getState().activeNotifications).toEqual([activeNotification]);
  });

  it('reports an acknowledgement failure without attempting a refresh', async () => {
    acknowledgeNotificationMock.mockRejectedValue(new Error('acknowledgement unavailable'));

    render(<NotificationItem notification={activeNotification} />);
    fireEvent.click(screen.getByRole('link', { name: 'ERRAND-1' }));

    await waitFor(() => {
      expect(mocks.snackbar).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'api_errors.acknowledge_notification', status: 'error' })
      );
    });
    expect(getNotificationsMock).not.toHaveBeenCalled();
  });
});
