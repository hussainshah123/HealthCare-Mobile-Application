import api from './client';
import type {
  Category,
  Medicine,
  MedicineDetail,
  MedicineQuery,
  Paginated,
  Pharmacy,
} from '../types';

export const catalogueApi = {
  categories: () => api.get<Category[]>('/categories').then(r => r.data),
  medicines: (params: MedicineQuery = {}) =>
    api
      .get<Paginated<Medicine>>('/medicines', { params: clean(params) })
      .then(r => r.data),
  medicine: (id: string) =>
    api.get<MedicineDetail>(`/medicines/${id}`).then(r => r.data),
  pharmacies: () => api.get<Pharmacy[]>('/pharmacies').then(r => r.data),
};

/** Drop empty query params so `?search=` is not sent as an empty filter. */
export function clean<T extends object>(params: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(params) as (keyof T)[]).forEach(k => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') {
      out[k] = v;
    }
  });
  return out;
}
