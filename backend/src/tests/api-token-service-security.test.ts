import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApiTokenService from '@/services/api-token.service';
import { logger } from '@/utils/logger';

const axiosMocks = vi.hoisted(() => ({
  isAxiosError: vi.fn<(error: unknown) => boolean>(),
  request: vi.fn<(config: unknown) => Promise<unknown>>(),
}));

vi.mock('axios', () => ({
  default: Object.assign(axiosMocks.request, {
    isAxiosError: axiosMocks.isAxiosError,
  }),
}));

const loggerError = vi.spyOn(logger, 'error').mockImplementation(() => logger);

const getLoggedMessages = (): string[] => loggerError.mock.calls.flatMap(([message]) => (typeof message === 'string' ? [message] : []));

describe('ApiTokenService security boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosMocks.isAxiosError.mockReturnValue(false);
  });

  it('does not serialize OAuth credentials when token retrieval fails', async () => {
    axiosMocks.request.mockRejectedValueOnce({
      config: {
        headers: { Authorization: 'Basic base64-client-secret' },
      },
      response: { status: 401, data: { detail: 'sensitive provider response' } },
    });
    axiosMocks.isAxiosError.mockReturnValue(true);

    await expect(new ApiTokenService().fetchToken()).rejects.toMatchObject({ status: 502 });

    const [tokenRequest] = axiosMocks.request.mock.calls[0] ?? [];
    expect(tokenRequest).toMatchObject({ maxRedirects: 0, timeout: 30_000 });

    const loggedMessages = getLoggedMessages();
    expect(loggedMessages.some(message => message.includes('Failed to fetch OAuth access token'))).toBe(true);
    expect(loggedMessages.some(message => message.includes('base64-client-secret'))).toBe(false);
    expect(loggedMessages.some(message => message.includes('sensitive provider response'))).toBe(false);
  });
});
