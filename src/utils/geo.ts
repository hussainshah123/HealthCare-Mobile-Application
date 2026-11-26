import type { LatLng } from '../types';

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres between two points (haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Average urban rider speed used for ETA when the device reports no speed. */
export const DEFAULT_RIDER_SPEED_KMH = 25;

/**
 * Estimated minutes to cover `distanceKm`. `speedMps` is the rider's reported
 * speed in m/s; we ignore very low values (stopped at a light) and fall back
 * to the average speed.
 */
export function etaMinutes(
  distanceKm: number,
  speedMps?: number | null,
): number {
  const kmh =
    speedMps && speedMps > 1.5 ? speedMps * 3.6 : DEFAULT_RIDER_SPEED_KMH;
  return Math.max(1, Math.round((distanceKm / kmh) * 60));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function toMapCoord(p: LatLng) {
  return { latitude: p.lat, longitude: p.lng };
}
