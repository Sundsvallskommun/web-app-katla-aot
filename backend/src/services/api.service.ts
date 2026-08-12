import axios, { AxiosRequestConfig, AxiosResponse, RawAxiosRequestHeaders } from 'axios';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@/interfaces/api-service.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { User } from '@/interfaces/users.interface';
import { logger } from '@/utils/logger';
import { apiURL } from '@/utils/util';

import ApiTokenService from './api-token.service';

export interface ApiRequestConfig extends AxiosRequestConfig {
  /** Preserve an upstream 4xx status without exposing its untrusted response body. */
  propagateClientError?: boolean;
}

interface ApiRequest extends Omit<Partial<RequestWithUser>, 'session'> {
  session: Omit<Partial<Request['session']>, 'user'> & { user?: Pick<User, 'username'> };
}

const API_REQUEST_TIMEOUT_MS = 30_000;
const ABSOLUTE_URL_PATTERN = /^([a-z][a-z\d+.-]*:)?\/\//i;

interface ResolvedRequestUrl {
  requestUrl: URL;
  boundaryUrl: URL;
}

const asDirectoryUrl = (url: URL): URL => {
  const directoryUrl = new URL(url.toString());
  directoryUrl.pathname = `${directoryUrl.pathname.replace(/\/+$/, '')}/`;
  directoryUrl.search = '';
  directoryUrl.hash = '';
  return directoryUrl;
};

const isWithinUrlBoundary = (candidate: URL, boundary: URL): boolean =>
  candidate.origin === boundary.origin && candidate.pathname.startsWith(asDirectoryUrl(boundary).pathname);

const assertDecodedPathWithinBoundary = (candidateUrl: URL, boundaryUrl: URL): void => {
  let decodedPath = candidateUrl.pathname;

  // Express and upstream gateways may decode a path segment at different layers.
  // Validate every effective representation so encoded separators cannot hide an
  // otherwise obvious dot-segment escape from the configured service base.
  for (let decodingPass = 0; decodingPass < 3; decodingPass += 1) {
    let nextDecodedPath: string;
    try {
      nextDecodedPath = decodeURIComponent(decodedPath);
    } catch {
      throw new HttpException(500, 'Invalid upstream request URL');
    }

    if (nextDecodedPath === decodedPath) return;
    const decodedUrl = new URL(nextDecodedPath, candidateUrl.origin);
    if (!isWithinUrlBoundary(decodedUrl, boundaryUrl)) {
      throw new HttpException(500, 'Invalid upstream request URL');
    }
    decodedPath = nextDecodedPath;
  }

  // Deeply nested encodings are ambiguous between infrastructure layers and have
  // no valid use in the gateway-owned API paths.
  let furtherDecodedPath: string;
  try {
    furtherDecodedPath = decodeURIComponent(decodedPath);
  } catch {
    throw new HttpException(500, 'Invalid upstream request URL');
  }
  if (furtherDecodedPath !== decodedPath) {
    throw new HttpException(500, 'Invalid upstream request URL');
  }
};

const resolveRequestUrl = (config: Pick<AxiosRequestConfig, 'baseURL' | 'url'>): ResolvedRequestUrl => {
  const requestPath = config.url ?? '';

  if (ABSOLUTE_URL_PATTERN.test(requestPath)) {
    throw new HttpException(500, 'Invalid upstream request URL');
  }

  const boundaryUrl = new URL(config.baseURL ?? apiURL(''));
  const requestUrl = new URL(requestPath.replace(/^\/+/, ''), asDirectoryUrl(boundaryUrl));
  assertDecodedPathWithinBoundary(requestUrl, boundaryUrl);

  // WHATWG URL resolution normalizes dot segments. Check the effective URL after
  // that normalization so a relative `../` path cannot escape a service base.
  if (!isWithinUrlBoundary(requestUrl, boundaryUrl)) {
    throw new HttpException(500, 'Invalid upstream request URL');
  }

  return { requestUrl, boundaryUrl };
};

const logAxiosErrorResponse = (response: AxiosResponse<unknown>): void => {
  const requestId = response.config.headers.get('X-Request-Id');
  const safeRequestId = typeof requestId === 'string' ? requestId : 'unknown';
  logger.error(`API request failed: status=${response.status}, method=${response.config.method ?? 'unknown'}, requestId=${safeRequestId}`);
};

const getBoundedLocation = (location: string, requestUrl: URL, boundaryUrl: URL): string => {
  const responseUrl = new URL(location, requestUrl);

  try {
    assertDecodedPathWithinBoundary(responseUrl, boundaryUrl);
  } catch (error) {
    if (error instanceof HttpException) {
      throw new HttpException(502, 'Invalid upstream redirect');
    }
    throw error;
  }

  if (!isWithinUrlBoundary(responseUrl, boundaryUrl)) {
    throw new HttpException(502, 'Invalid upstream redirect');
  }

  return responseUrl.toString();
};

class ApiService {
  private apiTokenService = new ApiTokenService();

  private async request<T>(config: ApiRequestConfig, req?: ApiRequest): Promise<ApiResponse<T>> {
    const { propagateClientError = false, ...axiosConfig } = config;
    const { requestUrl, boundaryUrl } = resolveRequestUrl(axiosConfig);
    const token = await this.apiTokenService.getToken();

    const requestId = uuidv4();
    const defaultParams = {};

    // Anropare skickar alltid vanliga header-objekt; typen breddas för att kunna spridas säkert.
    const configHeaders: RawAxiosRequestHeaders | undefined = axiosConfig.headers;

    const preparedConfig: AxiosRequestConfig = {
      ...axiosConfig,
      headers: {
        'Content-Type': 'application/json',
        ...configHeaders,
        Authorization: `Bearer ${token}`,
        'X-Request-Id': requestId,
        'X-Sent-By': `type=adAccount; ${req?.user?.username}`,
      },
      maxRedirects: 0,
      params: { ...defaultParams, ...(config.params as Record<string, unknown> | undefined) },
      timeout: API_REQUEST_TIMEOUT_MS,
      baseURL: undefined,
      url: requestUrl.toString(),
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`API request [${preparedConfig.method}]: ${preparedConfig.url}`);
        logger.info(`x-request-id: ${requestId}`);
      }
      const res = await axios<T>(preparedConfig);

      const location = res.headers.location as string | undefined;
      if (!location) {
        return { data: res.data, message: 'success' };
      }

      const responseUrl = getBoundedLocation(location, requestUrl, boundaryUrl);
      const getRes = await axios.get<T>(responseUrl, {
        headers: preparedConfig.headers,
        maxRedirects: 0,
        timeout: API_REQUEST_TIMEOUT_MS,
      });

      return { data: getRes.data, message: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const response = axios.isAxiosError(error) ? error.response : undefined;
      if (response?.status === 404) {
        logAxiosErrorResponse(response);
        throw new HttpException(404, 'Not found');
      }
      if (response && propagateClientError && response.status >= 400 && response.status < 500 && response.status !== 401) {
        logAxiosErrorResponse(response);
        throw new HttpException(response.status, 'Upstream request rejected');
      }
      if (response?.data) {
        logAxiosErrorResponse(response);
      } else {
        logger.error(`Unknown API error: ${error instanceof Error ? error.name : 'non-error rejection'}`);
      }
      // NOTE: did you subscribe to the API called?
      throw new HttpException(500, 'Internal server error from gateway');
    }
  }

  public async get<T>(config: ApiRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' }, req);
  }

  public async post<T>(config: ApiRequestConfig, req?: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' }, req);
  }

  public async put<T>(config: ApiRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT' }, req);
  }

  public async patch<T>(config: ApiRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' }, req);
  }

  public async delete<T>(config: ApiRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' }, req);
  }
}

export default ApiService;
