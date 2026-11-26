import { getSocket } from './client';
import type { ConsultationMessage } from '../types';

export type SignalType = 'webrtc:offer' | 'webrtc:answer' | 'webrtc:ice';

export const consultationSocket = {
  /** Joins the consultation room (participants only); re-joins on reconnect. */
  join(consultationId: string) {
    const s = getSocket('/consultations');
    const emitJoin = () => s.emit('consultation:join', { consultationId });
    if (s.connected) {
      emitJoin();
    }
    s.on('connect', emitJoin);
    return () => {
      s.off('connect', emitJoin);
    };
  },

  /** Returns false when offline so the caller can fall back to HTTP. */
  sendMessage(consultationId: string, body: string): boolean {
    const s = getSocket('/consultations');
    if (!s.connected) {
      return false;
    }
    s.emit('consultation:message', { consultationId, body });
    return true;
  },

  onMessage(handler: (m: ConsultationMessage) => void) {
    const s = getSocket('/consultations');
    s.on('consultation:message', handler);
    return () => {
      s.off('consultation:message', handler);
    };
  },

  onEnded(handler: (e: { consultationId: string }) => void) {
    const s = getSocket('/consultations');
    s.on('consultation:ended', handler);
    return () => {
      s.off('consultation:ended', handler);
    };
  },

  /** WebRTC signalling relay (used once react-native-webrtc is integrated). */
  signal(type: SignalType, consultationId: string, data: unknown) {
    getSocket('/consultations').emit(type, { consultationId, data });
  },

  onSignal(
    type: SignalType,
    handler: (e: { consultationId: string; data: unknown }) => void,
  ) {
    const s = getSocket('/consultations');
    s.on(type, handler);
    return () => {
      s.off(type, handler);
    };
  },
};
