// Knowing an errand's guid must not be enough to patch it. Every authenticated user can list the
// whole namespace, so guids are not secret — updateErrand has to check the reporter itself.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportManagementController } from '@/controllers/supportmanagement.controller';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';

const { get, patch } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));

vi.mock('@/services/api.service', () => ({
  default: class {
    get = get;
    patch = patch;
    post = vi.fn();
    put = vi.fn();
    delete = vi.fn();
  },
}));

const ERRAND_ID = '3f1b0c9e-0000-4000-8000-000000000001';

const requestAs = (username: string): RequestWithUser => ({ user: { username } }) as RequestWithUser;

const upstreamReturnsReporter = (reporterUserId: string | undefined) => {
  get.mockResolvedValue({ data: { id: ERRAND_ID, reporterUserId } });
};

describe('errand update ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patch.mockResolvedValue({ data: { id: ERRAND_ID, stakeholders: [] } });
  });

  it('updates an errand the user registered', async () => {
    upstreamReturnsReporter('user1');

    await new SupportManagementController().updateErrand(requestAs('user1'), ERRAND_ID, { title: 'ny titel' });

    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('refuses to patch an errand registered by another user', async () => {
    upstreamReturnsReporter('user2');

    await expect(new SupportManagementController().updateErrand(requestAs('user1'), ERRAND_ID, { title: 'kapad' })).rejects.toMatchObject({
      status: 403,
    });
  });

  it('does not reach upstream with the update when ownership fails', async () => {
    upstreamReturnsReporter('user2');

    await expect(new SupportManagementController().updateErrand(requestAs('user1'), ERRAND_ID, { title: 'kapad' })).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(patch).not.toHaveBeenCalled();
  });

  it('refuses an errand that carries no reporter, rather than treating it as unowned', async () => {
    upstreamReturnsReporter(undefined);

    await expect(new SupportManagementController().updateErrand(requestAs('user1'), ERRAND_ID, { title: 'x' })).rejects.toMatchObject({
      status: 403,
    });
    expect(patch).not.toHaveBeenCalled();
  });

  it('accepts a casing difference in the AD account name', async () => {
    upstreamReturnsReporter('User1');

    await new SupportManagementController().updateErrand(requestAs('user1'), ERRAND_ID, { title: 'ny titel' });

    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('checks ownership before spending a request on the update', async () => {
    upstreamReturnsReporter('user1');

    await new SupportManagementController().updateErrand(requestAs('user1'), ERRAND_ID, { title: 'ny titel' });

    expect(get.mock.invocationCallOrder[0]).toBeLessThan(patch.mock.invocationCallOrder[0] ?? Infinity);
  });
});
