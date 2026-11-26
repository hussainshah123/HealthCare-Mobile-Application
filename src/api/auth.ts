import api from './client';
import type { AuthResponse, LoginBody, RegisterBody, User } from '../types';

export const authApi = {
  register: (body: RegisterBody) =>
    api.post<AuthResponse>('/auth/register', body).then(r => r.data),
  login: (body: LoginBody) =>
    api.post<AuthResponse>('/auth/login', body).then(r => r.data),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then(r => r.data),
  logout: (refreshToken: string) =>
    api.post<void>('/auth/logout', { refreshToken }).then(() => undefined),
  me: () => api.get<User>('/auth/me').then(r => r.data),
};
