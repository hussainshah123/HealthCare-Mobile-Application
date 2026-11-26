import api from './client';
import type { RiderEarnings, RiderProfile, UpdateRiderBody } from '../types';

export const ridersApi = {
  me: () => api.get<RiderProfile>('/riders/me').then(r => r.data),
  update: (body: UpdateRiderBody) =>
    api.patch<RiderProfile>('/riders/me', body).then(r => r.data),
  setAvailability: (online: boolean) =>
    api
      .patch<RiderProfile>('/riders/me/availability', { online })
      .then(r => r.data),
  earnings: () =>
    api.get<RiderEarnings>('/riders/me/earnings').then(r => r.data),
};
