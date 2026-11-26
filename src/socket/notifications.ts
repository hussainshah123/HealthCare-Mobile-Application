import { getSocket } from './client';
import type { AppNotification } from '../types';

export const notificationSocket = {
  connect: () => getSocket('/notifications'),

  onNotification(handler: (n: AppNotification) => void) {
    const s = getSocket('/notifications');
    s.on('notification', handler);
    return () => {
      s.off('notification', handler);
    };
  },

  onAppointmentUpdated(handler: (payload: unknown) => void) {
    const s = getSocket('/notifications');
    s.on('appointment:updated', handler);
    return () => {
      s.off('appointment:updated', handler);
    };
  },
};
