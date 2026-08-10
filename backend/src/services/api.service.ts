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

interface ApiRequest extends Omit<Partial<RequestWithUser>, 'session'> {
  session: Omit<Partial<Request['session']>, 'user'> & { user?: Pick<User, 'username'> };
}

const logAxiosErrorResponse = (response: AxiosResponse<unknown>): void => {
  // Request-datat är vid det här laget serialiserat av axios till en sträng.
  const requestData = response.config.data as string | undefined;
  logger.error(`ERROR: API request failed with status: ${response.status}`);
  logger.error(`Error details: ${JSON.stringify(response.data)}`);
  logger.error(`Error url: ${response.config.baseURL ?? ''}/${response.config.url}`);
  logger.error(`Error data: ${requestData?.slice(0, 1500)}`);
  logger.error(`Error method: ${response.config.method}`);
  logger.error(`Error headers: ${JSON.stringify(response.config.headers)}`);
};

class ApiService {
  private apiTokenService = new ApiTokenService();

  private async request<T>(config: AxiosRequestConfig, req?: ApiRequest): Promise<ApiResponse<T>> {
    const token = await this.apiTokenService.getToken();

    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-Id': uuidv4(),
      'X-Sent-By': `type=adAccount; ${req?.user?.username}`,
    };
    const defaultParams = {};

    // Anropare skickar alltid vanliga header-objekt; typen breddas för att kunna spridas säkert.
    const configHeaders: RawAxiosRequestHeaders | undefined = config.headers;

    const preparedConfig: AxiosRequestConfig = {
      ...config,
      headers: { ...defaultHeaders, ...configHeaders },
      params: { ...defaultParams, ...(config.params as Record<string, unknown> | undefined) },
      url: config.baseURL ? config.url : apiURL(config.url ?? ''),
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`API request [${preparedConfig.method}]: ${preparedConfig.url}`);
        logger.info(`x-request-id: ${defaultHeaders['X-Request-Id']}`);
      }
      const res = await axios<T>(preparedConfig);

      const location = res.headers.location as string | undefined;
      if (!location) {
        return { data: res.data, message: 'success' };
      }

      const getRes = await axios.get<T>(location, { baseURL: config.baseURL, headers: defaultHeaders });

      return { data: getRes.data, message: 'success' };
    } catch (error) {
      const response = axios.isAxiosError(error) ? error.response : undefined;
      if (response?.status === 404) {
        logAxiosErrorResponse(response);
        throw new HttpException(404, 'Not found');
      }
      if (response?.data) {
        logAxiosErrorResponse(response);
      } else {
        console.error(`Unknown error: ${JSON.stringify(error).slice(0, 150)}`);
        logger.error(`Unknown error: ${JSON.stringify(error).slice(0, 150)}`);
      }
      // NOTE: did you subscribe to the API called?
      throw new HttpException(500, 'Internal server error from gateway');
    }
  }

  public async get<T>(config: AxiosRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET' }, req);
  }

  public async post<T>(config: AxiosRequestConfig, req?: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST' }, req);
  }

  public async put<T>(config: AxiosRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT' }, req);
  }

  public async patch<T>(config: AxiosRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH' }, req);
  }

  public async delete<T>(config: AxiosRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE' }, req);
  }
}

export default ApiService;
