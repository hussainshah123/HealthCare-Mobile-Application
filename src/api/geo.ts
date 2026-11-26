import api from './client';

export interface ReverseGeocode {
  line1: string;
  city: string | null;
}

export const geoApi = {
  /** GPS point → readable address to pre-fill a form. 404 when nothing is found. */
  reverse: (lat: number, lng: number) =>
    api
      .get<ReverseGeocode>('/geo/reverse', { params: { lat, lng } })
      .then(r => r.data),
};
