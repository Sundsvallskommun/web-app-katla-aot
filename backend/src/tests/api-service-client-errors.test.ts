import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ApiService from '@/services/api.service';
import ApiTokenService from '@/services/api-token.service';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

describe('ApiService client-error propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ApiTokenService.prototype, 'getToken').mockResolvedValue('test-token');
  });

  it('treats an upstream 204 response with no body as a successful request', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: undefined,
      status: 204,
      statusText: 'No Content',
      headers: {},
      config: { headers: {} },
    });

    await expect(
      new ApiService().patch<undefined>(
        {
          baseURL: 'https://api.example.test',
          url: '/notifications',
        },
        { session: {} },
      ),
    ).resolves.toEqual({ data: undefined, message: 'success' });
  });

  it('preserves an opted-in upstream conflict status with a safe message', async () => {
    const response = {
      status: 409,
      data: { detail: 'Sensitive upstream conflict details' },
      config: {
        method: 'patch',
        headers: { get: () => 'request-id-409' },
      },
    };
    mockedAxios.mockRejectedValueOnce({ response });
    mockedAxios.isAxiosError.mockReturnValue(true);

    await expect(
      new ApiService().patch(
        {
          baseURL: 'https://api.example.test',
          url: '/errands/123',
          propagateClientError: true,
        },
        { session: {} },
      ),
    ).rejects.toMatchObject({ status: 409, message: 'Upstream request rejected' });

    const requestConfig: unknown = mockedAxios.mock.calls[0]?.[0];
    if (!requestConfig || typeof requestConfig !== 'object') throw new Error('Expected an Axios request config');
    expect('propagateClientError' in requestConfig).toBe(false);
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
    mockedAxios.mockRejectedValueOnce({ response });
    mockedAxios.isAxiosError.mockReturnValue(true);

    await expect(new ApiService().patch({ baseURL: 'https://api.example.test', url: '/errands/123' }, { session: {} })).rejects.toMatchObject({
      status: 500,
      message: 'Internal server error from gateway',
    });
  });

  it('does not pass through an upstream authentication challenge', async () => {
    const response = {
      status: 401,
      data: { detail: 'Gateway credential rejected' },
      config: {
        method: 'patch',
        headers: { get: () => 'request-id-401' },
      },
    };
    mockedAxios.mockRejectedValueOnce({ response });
    mockedAxios.isAxiosError.mockReturnValue(true);

    await expect(
      new ApiService().patch(
        {
          baseURL: 'https://api.example.test',
          url: '/errands/123',
          propagateClientError: true,
        },
        { session: {} },
      ),
    ).rejects.toMatchObject({ status: 500, message: 'Internal server error from gateway' });
  });
});
