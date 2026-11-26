import api from './client';
import { clean } from './catalogue';
import type {
  AvailabilitySlot,
  DoctorCard,
  DoctorDetail,
  DoctorEarnings,
  DoctorProfile,
  DoctorQuery,
  Paginated,
  Slot,
  Specialization,
  UpdateDoctorBody,
} from '../types';

export const doctorsApi = {
  specializations: () =>
    api.get<Specialization[]>('/specializations').then(r => r.data),
  list: (params: DoctorQuery = {}) =>
    api
      .get<Paginated<DoctorCard>>('/doctors', { params: clean(params) })
      .then(r => r.data),
  get: (id: string) =>
    api.get<DoctorDetail>(`/doctors/${id}`).then(r => r.data),
  /** date: YYYY-MM-DD */
  slots: (id: string, date: string) =>
    api
      .get<Slot[]>(`/doctors/${id}/slots`, { params: { date } })
      .then(r => r.data),

  // ---- doctor (self) ----
  me: () => api.get<DoctorProfile>('/doctors/me').then(r => r.data),
  updateMe: (body: UpdateDoctorBody) =>
    api.patch<DoctorProfile>('/doctors/me', body).then(r => r.data),
  availability: () =>
    api
      .get<AvailabilitySlot[] | { slots: AvailabilitySlot[] }>(
        '/doctors/me/availability',
      )
      .then(r => (Array.isArray(r.data) ? r.data : r.data?.slots ?? [])),
  setAvailability: (slots: AvailabilitySlot[]) =>
    api.put('/doctors/me/availability', { slots }).then(r => r.data),
  earnings: () =>
    api.get<DoctorEarnings>('/doctors/me/earnings').then(r => r.data),
};
