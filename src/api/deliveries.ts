import api from './client';
import type {
  AvailableDelivery,
  Delivery,
  LocationBody,
  PageQuery,
  Paginated,
  TrackingInfo,
} from '../types';

export const deliveriesApi = {
  // ---- rider ----
  available: () =>
    api.get<AvailableDelivery[]>('/deliveries/available').then(r => r.data),
  active: () =>
    api.get<Delivery | null>('/deliveries/active').then(r => r.data || null),
  history: (params: PageQuery = {}) =>
    api
      .get<Paginated<Delivery>>('/deliveries/history', { params })
      .then(r => r.data),
  /** Note: accept takes the ORDER id; the other actions take the delivery id. */
  accept: (orderId: string) =>
    api.post<Delivery>(`/deliveries/${orderId}/accept`).then(r => r.data),
  reject: (id: string) =>
    api.post<Delivery>(`/deliveries/${id}/reject`).then(r => r.data),
  pickup: (id: string) =>
    api.post<Delivery>(`/deliveries/${id}/pickup`).then(r => r.data),
  start: (id: string) =>
    api.post<Delivery>(`/deliveries/${id}/start`).then(r => r.data),
  complete: (id: string, otp: string) =>
    api.post<Delivery>(`/deliveries/${id}/complete`, { otp }).then(r => r.data),
  /** HTTP fallback when the /tracking socket is not connected. */
  postLocation: (id: string, body: LocationBody) =>
    api.post(`/deliveries/${id}/location`, body).then(() => undefined),

  // ---- customer ----
  /** Only available while the order is RIDER_ASSIGNED..ON_THE_WAY. */
  tracking: (orderId: string) =>
    api
      .get<TrackingInfo>(`/deliveries/order/${orderId}/tracking`)
      .then(r => r.data),
};
