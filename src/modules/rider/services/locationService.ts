import Geolocation, {
  type GeolocationError,
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import { deliveriesApi } from '../../../api/deliveries';
import { trackingSocket } from '../../../socket/tracking';
import { requestLocationPermission } from '../../../utils/location';

/**
 * Rider location sharing.
 *
 * While a delivery is active (ASSIGNED / PICKED_UP / ON_THE_WAY) we watch GPS
 * and emit `rider:location { deliveryId, lat, lng, heading?, speed? }` on the
 * /tracking namespace. If the socket is down we fall back to
 * POST /deliveries/:id/location (throttled). Sharing stops when the delivery
 * is delivered / cancelled (the ActiveDeliveryProvider calls stop()).
 *
 * NOTE: @react-native-community/geolocation only delivers updates while the app
 * is in the foreground. For background tracking add an Android foreground
 * service (FOREGROUND_SERVICE_LOCATION is already declared in the manifest) and
 * iOS "location" UIBackgroundModes, e.g. via a background-geolocation library.
 */

export interface RiderPosition {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

export type SharingState =
  | { status: 'idle' }
  | { status: 'starting'; deliveryId: string }
  | { status: 'sharing'; deliveryId: string; via: 'socket' | 'http' }
  | { status: 'denied'; deliveryId: string }
  | { status: 'error'; deliveryId: string; message: string };

type Listener = (state: SharingState, position: RiderPosition | null) => void;

const SOCKET_MIN_INTERVAL_MS = 3000;
const HTTP_MIN_INTERVAL_MS = 10000;

class LocationService {
  private watchId: number | null = null;
  private deliveryId: string | null = null;
  private state: SharingState = { status: 'idle' };
  private position: RiderPosition | null = null;
  private lastSocketEmit = 0;
  private lastHttpPost = 0;
  private listeners = new Set<Listener>();

  getState() {
    return this.state;
  }

  getPosition() {
    return this.position;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state, this.position);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(state: SharingState) {
    this.state = state;
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.state, this.position));
  }

  /** Starts sharing for a delivery (no-op if already sharing that delivery). */
  async start(deliveryId: string): Promise<void> {
    if (this.deliveryId === deliveryId && this.watchId !== null) {
      return;
    }
    this.stop();
    this.deliveryId = deliveryId;
    this.setState({ status: 'starting', deliveryId });

    const granted = await requestLocationPermission();
    if (this.deliveryId !== deliveryId) {
      return; // stopped meanwhile
    }
    if (!granted) {
      this.setState({ status: 'denied', deliveryId });
      return;
    }

    this.watchId = Geolocation.watchPosition(
      pos => this.onPosition(deliveryId, pos),
      err => this.onError(deliveryId, err),
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // metres
        interval: 5000, // Android
        fastestInterval: 3000, // Android
        timeout: 20000,
        maximumAge: 5000,
      },
    );
  }

  stop() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;
    this.deliveryId = null;
    this.lastSocketEmit = 0;
    this.lastHttpPost = 0;
    if (this.state.status !== 'idle') {
      this.setState({ status: 'idle' });
    }
  }

  private onPosition(deliveryId: string, pos: GeolocationResponse) {
    if (this.deliveryId !== deliveryId) {
      return;
    }
    const { latitude, longitude, heading, speed, accuracy } = pos.coords;
    this.position = {
      lat: latitude,
      lng: longitude,
      heading: heading != null && heading >= 0 ? heading : null,
      speed: speed != null && speed >= 0 ? speed : null,
      accuracy: accuracy ?? null,
      timestamp: pos.timestamp,
    };
    this.publish(deliveryId);
  }

  private publish(deliveryId: string) {
    const p = this.position;
    if (!p) {
      return;
    }
    const now = Date.now();
    const payload = {
      lat: p.lat,
      lng: p.lng,
      heading: p.heading ?? undefined,
      speed: p.speed ?? undefined,
    };

    if (now - this.lastSocketEmit >= SOCKET_MIN_INTERVAL_MS) {
      const sent = trackingSocket.emitRiderLocation({ deliveryId, ...payload });
      if (sent) {
        this.lastSocketEmit = now;
        this.setState({ status: 'sharing', deliveryId, via: 'socket' });
        return;
      }
    } else if (this.state.status === 'sharing' && this.state.via === 'socket') {
      this.notify(); // throttled, but let the UI see the new position
      return;
    }

    // Socket offline -> HTTP fallback.
    if (now - this.lastHttpPost >= HTTP_MIN_INTERVAL_MS) {
      this.lastHttpPost = now;
      deliveriesApi
        .postLocation(deliveryId, payload)
        .then(() => {
          if (this.deliveryId === deliveryId) {
            this.setState({ status: 'sharing', deliveryId, via: 'http' });
          }
        })
        .catch(e => {
          if (this.deliveryId === deliveryId) {
            this.setState({
              status: 'error',
              deliveryId,
              message: String(e?.message ?? e),
            });
          }
        });
    } else {
      this.notify();
    }
  }

  private onError(deliveryId: string, err: GeolocationError) {
    if (this.deliveryId !== deliveryId) {
      return;
    }
    // code 1 = PERMISSION_DENIED
    if (err.code === 1) {
      this.setState({ status: 'denied', deliveryId });
    } else {
      this.setState({ status: 'error', deliveryId, message: err.message });
    }
  }
}

export const locationService = new LocationService();
