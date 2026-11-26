import api from './client';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentBody,
  PageQuery,
  Paginated,
} from '../types';

export const appointmentsApi = {
  /** 409 when the slot is already taken. */
  create: (body: CreateAppointmentBody) =>
    api.post<Appointment>('/appointments', body).then(r => r.data),
  mine: (params: PageQuery & { status?: AppointmentStatus } = {}) =>
    api
      .get<Paginated<Appointment>>('/appointments/me', { params })
      .then(r => r.data),
  get: (id: string) =>
    api.get<Appointment>(`/appointments/${id}`).then(r => r.data),
  accept: (id: string) =>
    api.post<Appointment>(`/appointments/${id}/accept`).then(r => r.data),
  reject: (id: string, reason?: string) =>
    api
      .post<Appointment>(`/appointments/${id}/reject`, { reason })
      .then(r => r.data),
  cancel: (id: string, reason?: string) =>
    api
      .post<Appointment>(`/appointments/${id}/cancel`, { reason })
      .then(r => r.data),
};
