import api from './client';
import type {
  Address,
  CreateAddressBody,
  CustomerProfile,
  UpdateCustomerBody,
} from '../types';

export const customersApi = {
  me: () => api.get<CustomerProfile>('/customers/me').then(r => r.data),
  update: (body: UpdateCustomerBody) =>
    api.patch<CustomerProfile>('/customers/me', body).then(r => r.data),
  addresses: () =>
    api.get<Address[]>('/customers/me/addresses').then(r => r.data),
  addAddress: (body: CreateAddressBody) =>
    api.post<Address>('/customers/me/addresses', body).then(r => r.data),
  deleteAddress: (id: string) =>
    api.delete(`/customers/me/addresses/${id}`).then(() => undefined),
};
