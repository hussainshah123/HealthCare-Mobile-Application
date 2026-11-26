import api from './client';
import { API_BASE_URL } from './config';
import type { DoctorPrescription, Prescription } from '../types';

export interface UploadFile {
  uri: string;
  name: string;
  type: string; // image/jpeg | image/png | application/pdf
}

export const MAX_PRESCRIPTION_BYTES = 10 * 1024 * 1024;
export const ALLOWED_PRESCRIPTION_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

export const prescriptionsApi = {
  /** POST /prescriptions multipart: `file` (jpg/png/pdf <= 10 MB) + optional `notes`. */
  upload: (file: UploadFile, notes?: string) => {
    const form = new FormData();
    // React Native's FormData accepts { uri, name, type } file descriptors.
    form.append('file', file as unknown as Blob);
    if (notes) {
      form.append('notes', notes);
    }
    return api
      .post<Prescription>('/prescriptions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: data => data,
      })
      .then(r => r.data);
  },
  mine: () => api.get<Prescription[]>('/prescriptions/me').then(r => r.data),
  /** URL of the protected file; needs the bearer header to open. */
  fileUrl: (id: string) => `${API_BASE_URL}/prescriptions/${id}/file`,

  // Prescriptions written by doctors after a consultation
  doctorPrescriptions: () =>
    api.get<DoctorPrescription[]>('/doctor-prescriptions/me').then(r => r.data),
  doctorPrescription: (id: string) =>
    api
      .get<DoctorPrescription>(`/doctor-prescriptions/${id}`)
      .then(r => r.data),
};
