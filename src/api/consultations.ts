import api from './client';
import type {
  Consultation,
  ConsultationMessage,
  WritePrescriptionBody,
} from '../types';

export const consultationsApi = {
  /** Doctor only; takes the APPOINTMENT id. */
  start: (appointmentId: string) =>
    api
      .post<Consultation>(`/consultations/${appointmentId}/start`)
      .then(r => r.data),
  get: (id: string) =>
    api.get<Consultation>(`/consultations/${id}`).then(r => r.data),
  /** Doctor only. */
  end: (id: string) =>
    api.post<Consultation>(`/consultations/${id}/end`).then(r => r.data),
  messages: (id: string) =>
    api
      .get<ConsultationMessage[] | { items: ConsultationMessage[] }>(
        `/consultations/${id}/messages`,
      )
      .then(r => (Array.isArray(r.data) ? r.data : r.data?.items ?? [])),
  sendMessage: (id: string, body: string) =>
    api
      .post<ConsultationMessage>(`/consultations/${id}/messages`, { body })
      .then(r => r.data),
  /** Doctor only. */
  writePrescription: (id: string, body: WritePrescriptionBody) =>
    api.post(`/consultations/${id}/prescription`, body).then(r => r.data),
};
