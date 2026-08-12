import { acknowledgeNotification, createErrand, getErrands } from '@services/errand-service/errand-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@services/api-service', () => ({
  apiService: apiMocks,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Errand service contracts', () => {
  it('leaves sort unencoded for the HTTP client to serialize once', async () => {
    apiMocks.get.mockResolvedValue({ data: { content: [] } });

    await getErrands({ page: 0, size: 20, sortColumn: 'created', sortOrder: 'desc' });

    expect(apiMocks.get).toHaveBeenCalledWith('supportmanagement/errands', {
      params: { page: 0, size: 20, sort: 'created,desc' },
    });
  });

  it('preserves create errors for the calling form to handle', async () => {
    const error = new Error('Create failed');
    apiMocks.post.mockRejectedValue(error);

    await expect(createErrand({ title: 'User input' })).rejects.toBe(error);
  });

  it('rejects when notification acknowledgement fails upstream', async () => {
    const error = new Error('Acknowledge failed');
    apiMocks.patch.mockRejectedValue(error);

    await expect(acknowledgeNotification({ id: 'notification-id' })).rejects.toBe(error);
  });

  it('rejects a false acknowledgement response', async () => {
    apiMocks.patch.mockResolvedValue({ data: { data: false, message: 'Not acknowledged' } });

    await expect(acknowledgeNotification({ id: 'notification-id' })).rejects.toThrow(
      'Notification was not acknowledged'
    );
  });

  it('returns success only for an explicitly acknowledged notification', async () => {
    apiMocks.patch.mockResolvedValue({ data: { data: true, message: 'Success' } });

    await expect(acknowledgeNotification({ id: 'notification-id' })).resolves.toBe(true);
    expect(apiMocks.patch).toHaveBeenCalledWith('supportmanagement/notifications', [
      { id: 'notification-id', acknowledged: true },
    ]);
  });
});
