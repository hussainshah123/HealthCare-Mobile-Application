import type { Socket } from 'socket.io-client';
import { getSocket } from './client';
import type {
  DeliveryStatusEvent,
  RiderLocationEmit,
  RiderLocationEvent,
} from '../types';

export interface JoinAck {
  ok: boolean;
  lastLocation?: RiderLocationEvent | null;
  message?: string;
}

export const trackingSocket = {
  get: (): Socket => getSocket('/tracking'),

  /** Customer joins an order's tracking room. */
  join(orderId: string, ack?: (res: JoinAck) => void) {
    const s = getSocket('/tracking');
    const emitJoin = () =>
      s.emit('delivery:join', { orderId }, (res: JoinAck) => ack?.(res));
    if (s.connected) {
      emitJoin();
    }
    // re-join after every (re)connect
    s.on('connect', emitJoin);
    return () => {
      s.off('connect', emitJoin);
      if (s.connected) {
        s.emit('delivery:leave', { orderId });
      }
    };
  },

  onRiderLocation(handler: (e: RiderLocationEvent) => void) {
    const s = getSocket('/tracking');
    s.on('rider:location', handler);
    return () => {
      s.off('rider:location', handler);
    };
  },

  onDeliveryStatus(handler: (e: DeliveryStatusEvent) => void) {
    const s = getSocket('/tracking');
    s.on('delivery:status', handler);
    return () => {
      s.off('delivery:status', handler);
    };
  },

  /** Rider emits its GPS position. Returns false if the socket is offline. */
  emitRiderLocation(payload: RiderLocationEmit): boolean {
    const s = getSocket('/tracking');
    if (!s.connected) {
      return false;
    }
    s.emit('rider:location', payload);
    return true;
  },
};
