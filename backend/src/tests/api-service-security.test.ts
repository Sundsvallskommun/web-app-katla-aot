import type { AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';
import ApiService from '@/services/api.service';
import ApiTokenService from '@/services/api-token.service';
import { logger } from '@/utils/logger';

const axiosMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string, config?: AxiosRequestConfig) => Promise<{ data: unknown }>>(),
  isAxiosError: vi.fn<(error: unknown) => boolean>(),
  request: vi.fn<(config: AxiosRequestConfig) => Promise<{ data: unknown; headers: Record<string, unknown> }>>(),
}));

vi.mock('axios', () => ({
  default: Object.assign(axiosMocks.request, {
    get: axiosMocks.get,
    isAxiosError: axiosMocks.isAxiosError,
  }),
}));

const loggerError = vi.spyOn(logger, 'error').mockImplementation(() => logger);

const getLoggedMessages = (): string[] => loggerError.mock.calls.flatMap(([message]) => (typeof message === 'string' ? [message] : []));

describe('ApiService security boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosMocks.isAxiosError.mockReturnValue(false);
    vi.spyOn(ApiTokenService.prototype, 'getToken').mockResolvedValue('top-secret-bearer-token');
  });

  it('logs request metadata without credentials or payload data', async () => {
    const response = {
      status: 400,
      data: { detail: 'upstream personal data' },
      config: {
        baseURL: 'https://api.example.test',
        url: '/errands',
        method: 'post',
        data: JSON.stringify({ personId: 'secret-person-id' }),
        headers: {
          Authorization: 'Bearer top-secret-bearer-token',
          get: (headerName: string) => (headerName === 'X-Request-Id' ? 'request-id-123' : undefined),
        },
      },
    };

    axiosMocks.request.mockRejectedValueOnce({ response });
    axiosMocks.isAxiosError.mockReturnValue(true);

    await expect(new ApiService().post({ baseURL: 'https://api.example.test', url: '/errands' })).rejects.toMatchObject({
      status: 500,
    } satisfies Partial<HttpException>);

    const loggedMessages = getLoggedMessages();
    expect(loggedMessages.some(message => message.includes('status=400'))).toBe(true);
    expect(loggedMessages.some(message => message.includes('requestId=request-id-123'))).toBe(true);
    expect(loggedMessages.some(message => message.includes('api.example.test'))).toBe(false);
    expect(loggedMessages.some(message => message.includes('top-secret-bearer-token'))).toBe(false);
    expect(loggedMessages.some(message => message.includes('secret-person-id'))).toBe(false);
    expect(loggedMessages.some(message => message.includes('upstream personal data'))).toBe(false);
    expect(loggedMessages.every(message => !/[\r\n]/.test(message))).toBe(true);
  });

  it('does not forward the bearer token to a cross-origin Location response', async () => {
    axiosMocks.request.mockResolvedValueOnce({
      data: undefined,
      headers: { location: 'https://attacker.example/errands/123' },
    });

    await expect(new ApiService().post({ baseURL: 'https://api.example.test', url: '/errands' })).rejects.toMatchObject({ status: 502 });

    expect(axiosMocks.get).not.toHaveBeenCalled();
  });

  it('resolves same-origin Location responses with the request timeout', async () => {
    axiosMocks.request.mockResolvedValueOnce({
      data: undefined,
      headers: { location: '/errands/123' },
    });
    axiosMocks.get.mockResolvedValueOnce({ data: { id: '123' } });

    await expect(new ApiService().post({ baseURL: 'https://api.example.test', url: '/errands' })).resolves.toEqual({
      data: { id: '123' },
      message: 'success',
    });

    const [redirectUrl, redirectConfig] = axiosMocks.get.mock.calls[0] ?? [];
    expect(redirectUrl).toBe('https://api.example.test/errands/123');
    expect(redirectConfig).toMatchObject({ maxRedirects: 0, timeout: 30_000 });
    expect(redirectConfig?.headers).toMatchObject({ Authorization: 'Bearer top-secret-bearer-token' });
  });

  it('sets a timeout on ordinary upstream requests', async () => {
    axiosMocks.request.mockResolvedValueOnce({ data: { ok: true }, headers: {} });

    await new ApiService().get({ baseURL: 'https://api.example.test', url: '/health' }, { session: {} });

    const [requestConfig] = axiosMocks.request.mock.calls[0] ?? [];
    expect(requestConfig).toMatchObject({
      baseURL: undefined,
      maxRedirects: 0,
      timeout: 30_000,
      url: 'https://api.example.test/health',
    });
  });

  it('does not allow callers to disable the gateway timeout', async () => {
    axiosMocks.request.mockResolvedValueOnce({ data: { ok: true }, headers: {} });

    await new ApiService().get({ baseURL: 'https://api.example.test', url: '/health', timeout: 0 }, { session: {} });

    const [requestConfig] = axiosMocks.request.mock.calls[0] ?? [];
    expect(requestConfig?.timeout).toBe(30_000);
  });

  it('does not allow a caller to override gateway-owned security headers', async () => {
    axiosMocks.request.mockResolvedValueOnce({ data: { ok: true }, headers: {} });

    await new ApiService().post({
      baseURL: 'https://api.example.test',
      url: '/errands',
      headers: {
        Authorization: 'Bearer caller-controlled-token',
        'X-Request-Id': 'caller-controlled-request-id',
        'X-Sent-By': 'caller-controlled-user',
      },
    });

    const [requestConfig] = axiosMocks.request.mock.calls[0] ?? [];
    expect(requestConfig?.headers).toMatchObject({
      Authorization: 'Bearer top-secret-bearer-token',
      'X-Sent-By': 'type=adAccount; undefined',
    });
    expect(requestConfig?.headers?.['X-Request-Id']).not.toBe('caller-controlled-request-id');
  });

  it('normalizes lowercase caller headers before applying gateway-owned values', async () => {
    axiosMocks.request.mockResolvedValueOnce({ data: { ok: true }, headers: {} });

    await new ApiService().post({
      baseURL: 'https://api.example.test',
      url: '/errands',
      headers: { authorization: 'Bearer lowercase-caller-token' },
    });

    const [requestConfig] = axiosMocks.request.mock.calls[0] ?? [];
    expect(requestConfig?.headers).toMatchObject({ Authorization: 'Bearer top-secret-bearer-token' });
  });

  it('converts status-shaped non-Axios rejections to the generic gateway error', async () => {
    axiosMocks.request.mockRejectedValueOnce({ status: 418, message: 'Caller-controlled rejection' });

    await expect(new ApiService().get({ baseURL: 'https://api.example.test', url: '/health' }, { session: {} })).rejects.toMatchObject({
      status: 500,
      message: 'Internal server error from gateway',
    });
  });

  it('preserves an opted-in upstream client status without exposing its response message', async () => {
    const response = {
      status: 409,
      data: { detail: 'Sensitive upstream conflict details' },
      config: {
        method: 'patch',
        headers: {
          get: (headerName: string) => (headerName === 'X-Request-Id' ? 'request-id-409' : undefined),
        },
      },
    };

    axiosMocks.request.mockRejectedValueOnce({ response });
    axiosMocks.isAxiosError.mockReturnValue(true);

    await expect(
      new ApiService().patch(
        {
          baseURL: 'https://api.example.test',
          url: '/errands/123',
          propagateClientError: true,
        },
        { session: {} },
      ),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Upstream request rejected',
    });

    const [requestConfig] = axiosMocks.request.mock.calls[0] ?? [];
    expect(requestConfig).not.toHaveProperty('propagateClientError');
    expect(getLoggedMessages().some(message => message.includes('Sensitive upstream conflict details'))).toBe(false);
  });

  it('keeps upstream client errors generic unless propagation is explicitly enabled', async () => {
    const response = {
      status: 409,
      data: { detail: 'Conflict' },
      config: {
        method: 'patch',
        headers: { get: () => 'request-id-default' },
      },
    };

    axiosMocks.request.mockRejectedValueOnce({ response });
    axiosMocks.isAxiosError.mockReturnValue(true);

    await expect(new ApiService().patch({ baseURL: 'https://api.example.test', url: '/errands/123' }, { session: {} })).rejects.toMatchObject({
      status: 500,
      message: 'Internal server error from gateway',
    });
  });

  it('never propagates an upstream 401 even when client-error propagation is enabled', async () => {
    const response = {
      status: 401,
      data: { detail: 'Upstream authentication details' },
      config: {
        method: 'patch',
        headers: { get: () => 'request-id-401' },
      },
    };

    axiosMocks.request.mockRejectedValueOnce({ response });
    axiosMocks.isAxiosError.mockReturnValue(true);

    await expect(
      new ApiService().patch(
        {
          baseURL: 'https://api.example.test/supportmanagement/14.14',
          url: '/errands/123',
          propagateClientError: true,
        },
        { session: {} },
      ),
    ).rejects.toMatchObject({
      status: 500,
      message: 'Internal server error from gateway',
    });

    expect(getLoggedMessages().some(message => message.includes('Upstream authentication details'))).toBe(false);
  });
});
