import api from './client';
import type { CreateOrderBody, Order, PageQuery, Paginated } from '../types';

export const ordersApi = {
  /** Creates the order from the current cart; the cart is emptied. */
  create: (body: CreateOrderBody) =>
    api.post<Order>('/orders', body).then(r => r.data),
  mine: (params: PageQuery = {}) =>
    api.get<Paginated<Order>>('/orders/me', { params }).then(r => r.data),
  get: (id: string) => api.get<Order>(`/orders/${id}`).then(r => r.data),
  /** Only allowed before pickup. */
  cancel: (id: string, reason?: string) =>
    api.post<Order>(`/orders/${id}/cancel`, { reason }).then(r => r.data),
  /** Refills the cart with this order's items. */
  reorder: (id: string) => api.post(`/orders/${id}/reorder`).then(r => r.data),
};
