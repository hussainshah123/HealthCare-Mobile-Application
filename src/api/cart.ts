import api from './client';
import type { Cart } from '../types';

export const cartApi = {
  get: () => api.get<Cart>('/cart').then(r => r.data),
  /** Answers 409 when the cart already holds items from another pharmacy. */
  addItem: (body: {
    medicineId: string;
    pharmacyId: string;
    quantity: number;
  }) => api.post('/cart/items', body).then(r => r.data),
  updateItem: (id: string, quantity: number) =>
    api.patch(`/cart/items/${id}`, { quantity }).then(r => r.data),
  removeItem: (id: string) =>
    api.delete(`/cart/items/${id}`).then(() => undefined),
  clear: () => api.delete('/cart').then(() => undefined),
};
