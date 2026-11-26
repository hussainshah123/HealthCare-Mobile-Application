import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { tokenStorage } from '../store/tokenStorage';
import type { AuthResponse } from '../types';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

/** Routes that must never carry a bearer token or trigger a refresh. */
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];
const isPublic = (url?: string) =>
  !!url && PUBLIC_PATHS.some(p => url.startsWith(p));

api.interceptors.request.use(config => {
  const token = tokenStorage.getAccessToken();
  if (token && !isPublic(config.url)) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// ---- automatic refresh on 401 ----

let sessionExpiredHandler: (() => void) | null = null;
/** The auth store registers this to drop to the login screen when refresh fails. */
export function onSessionExpired(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

let refreshPromise: Promise<string> | null = null;

/** Single-flight refresh: concurrent 401s wait for the same POST /auth/refresh. */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      // Plain axios so this call bypasses our interceptors.
      const { data } = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      await tokenStorage.save({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isPublic(original.url) ||
      !tokenStorage.getRefreshToken()
    ) {
      throw error;
    }
    original._retry = true;
    try {
      const token = await refreshAccessToken();
      const headers = AxiosHeaders.from(original.headers);
      headers.set('Authorization', `Bearer ${token}`);
      original.headers = headers;
      return api(original);
    } catch (refreshError) {
      // Only sign out when the server rejected the refresh token; a network
      // failure keeps the session so the user can retry.
      const rejected =
        !(refreshError instanceof AxiosError) || !!refreshError.response;
      if (rejected) {
        await tokenStorage.clear();
        sessionExpiredHandler?.();
      }
      throw error;
    }
  },
);

export default api;
