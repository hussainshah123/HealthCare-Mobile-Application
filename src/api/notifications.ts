import api from './client';
import type {
  AppNotification,
  DeviceTokenBody,
  PageQuery,
  Paginated,
} from '../types';

export const notificationsApi = {
  list: (params: PageQuery = {}) =>
    api
      .get<Paginated<AppNotification>>('/notifications', { params })
      .then(r => r.data),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then(() => undefined),
  markAllRead: () => api.patch('/notifications/read-all').then(() => undefined),
  /** FCM device token registration (wire up once FCM is added). */
  registerDevice: (body: DeviceTokenBody) =>
    api.post('/notifications/device-token', body).then(() => undefined),
};
