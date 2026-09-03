import { ApiResponse, handleError } from '@services/api-service';
import type { AxiosError } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Api service', () => {
  beforeEach(() => {
    // jsdom does not allow window.location to be replaced, but pathname can be set via history.
    window.history.replaceState({}, '', '/dashboard');
  });

  it('should throw the error', () => {
    const error = {
      response: {
        status: 401,
        data: {
          message: 'Unauthorized',
        },
      },
      config: {},
    } as AxiosError<ApiResponse>;

    expect(() => handleError(error)).toThrow();
  });

  it('should throw an error with a different status code', () => {
    const error = {
      response: {
        status: 500,
        data: {
          message: 'Server Error',
        },
      },
      config: {},
    } as AxiosError<ApiResponse>;

    expect(() => handleError(error)).toThrow();
  });

  it('should throw an error with no response data', () => {
    const error = {
      request: {},
      message: 'Network Error',
      config: {},
    } as AxiosError<ApiResponse>;

    expect(() => handleError(error)).toThrow();
  });
});
