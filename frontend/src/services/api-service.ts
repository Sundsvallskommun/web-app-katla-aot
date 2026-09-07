'use client';

import { apiURL } from '@utils/api-url';
import { isProtectedRoute, routePath } from '@utils/protected-routes';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
}

/** The login page to send a rejected request to, or undefined when the error should just surface. */
export const loginRedirectUrl = (error: AxiosError<ApiResponse>, pathname: string, origin: string): URL | undefined => {
  const path = routePath(pathname);
  //TODO: Refactor to be more compliant with NextJS routing standards
  if (!isProtectedRoute(path) || error?.response?.status !== 401 || path.includes('login')) return undefined;

  const loginUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`, origin);
  loginUrl.searchParams.set('path', pathname);
  loginUrl.searchParams.set('failMessage', error.response.data.message);
  return loginUrl;
};

export const handleError = (error: AxiosError<ApiResponse>) => {
  const loginUrl = loginRedirectUrl(error, window?.location.pathname ?? '', window.location.origin);
  if (loginUrl) window.location.assign(loginUrl);

  throw error;
};

const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

const get = <T>(url: string, options?: AxiosRequestConfig) =>
  axios.get<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);

const post = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.post<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const remove = <T>(url: string, options?: AxiosRequestConfig) => {
  return axios.delete<T>(apiURL(url), { ...defaultOptions, ...options }).catch(handleError);
};

const patch = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.patch<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

const put = <T>(url: string, data: unknown, options?: AxiosRequestConfig) => {
  return axios.put<T>(apiURL(url), data, { ...defaultOptions, ...options }).catch(handleError);
};

export const apiService = { get, post, put, patch, delete: remove };
