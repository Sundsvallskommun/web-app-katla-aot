'use client';

import { apiURL } from '@utils/api-url';
import { protectedRoutes } from '@utils/protected-routes';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
}

export const handleError = (error: AxiosError<ApiResponse>) => {
  if (!protectedRoutes.includes(window?.location.pathname)) throw error;

  //TODO: Refactor to be more compliant with NextJS routing standards
  if (error?.response?.status === 401 && !window?.location.pathname.includes('login')) {
    const loginUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`, window.location.origin);
    loginUrl.searchParams.set('path', window.location.pathname);
    loginUrl.searchParams.set('failMessage', error.response.data.message);
    window.location.assign(loginUrl);
  }

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
