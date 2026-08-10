import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { User } from '@/interfaces/users.interface';
import { logger } from '@/utils/logger';
import { apiURL } from '@/utils/util';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Request } from 'express';
import ApiTokenService from './api-token.service';
import { v4 as uuidv4 } from 'uuid';

class ApiResponse<T> {
  data: T;
  message: string;
}

interface ApiRequest extends Omit<Partial<RequestWithUser>, 'session'> {
  session: Omit<Partial<Request['session']>, 'user'> & { user?: Pick<User, 'username'> };
}

class ApiService {
  private apiTokenService = new ApiTokenService();

  private async request<T>(config: AxiosRequestConfig, req: ApiRequest): Promise<ApiResponse<T>> {
    const token = await this.apiTokenService.getToken();

    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-Id': uuidv4(),
      'X-Sent-By': `type=adAccount; ${req?.user?.username}`,
    };
    const defaultParams = {};

    const preparedConfig: AxiosRequestConfig = {
      ...config,
      headers: { ...defaultHeaders, ...config.headers },
      params: { ...defaultParams, ...config.params },
      url: config.baseURL ? config.url : apiURL(config.url),
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`API request [${preparedConfig.method}]: ${preparedConfig.url}`);
        logger.info(`x-request-id: ${defaultHeaders['X-Request-Id']}`);
      }
      const res = await axios(preparedConfig);

      if (!res.headers.location) {
        return { data: res.data, message: 'success' };
      }

      const getRes = await axios.get(res.headers.location, { baseURL: config.baseURL, headers: defaultHeaders });

      return { data: getRes.data, message: 'success' };
    } catch (error: unknown | AxiosError) {
      if (axios.isAxiosError(error) && (error as AxiosError).response?.status === 404) {
        logger.error(`ERROR: API request failed with status: ${error.response?.status}`);
        logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
        logger.error(`Error url: ${error.response.config.baseURL || ''}/${error.response.config.url}`);
        logger.error(`Error data: ${error.response.config.data?.slice(0, 1500)}`);
        logger.error(`Error method: ${error.response.config.method}`);
        logger.error(`Error headers: ${error.response.config.headers}`);
        throw new HttpException(404, 'Not found');
      } else if (axios.isAxiosError(error) && (error as AxiosError).response?.data) {
        logger.error(`ERROR: API request failed with status: ${error.response?.status}`);
        logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
        logger.error(`Error url: ${error.response.config.baseURL || ''}/${error.response.config.url}`);
        logger.error(`Error data: ${error.response.config.data?.slice(0, 1500)}`);
        logger.error(`Error method: ${error.response.config.method}`);
        logger.error(`Error headers: ${error.response.config.headers}`);
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
