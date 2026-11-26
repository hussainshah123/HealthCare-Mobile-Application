import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { deliveriesApi } from '../../../api/deliveries';
import { trackingSocket } from '../../../socket/tracking';
import { getErrorMessage } from '../../../utils/errors';
import type { Delivery } from '../../../types';
import {
  locationService,
  type RiderPosition,
  type SharingState,
} from '../services/locationService';

const ACTIVE_STATUSES: Delivery['status'][] = [
  'ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
];

export const isActiveDelivery = (
  d: Delivery | null | undefined,
): d is Delivery => !!d && ACTIVE_STATUSES.includes(d.status);

interface Value {
  delivery: Delivery | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setDelivery: (d: Delivery | null) => void;
  sharing: SharingState;
  position: RiderPosition | null;
}

const Ctx = createContext<Value | undefined>(undefined);

/**
 * Holds the rider's active delivery for the whole rider app and keeps the
 * location service running exactly while that delivery is active.
 */
export function ActiveDeliveryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [delivery, setDeliveryState] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState<SharingState>(
    locationService.getState(),
  );
  const [position, setPosition] = useState<RiderPosition | null>(
    locationService.getPosition(),
  );

  const setDelivery = useCallback((d: Delivery | null) => {
    setDeliveryState(isActiveDelivery(d) ? d : null);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setDelivery(await deliveriesApi.active());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [setDelivery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(
    () =>
      locationService.subscribe((s, p) => {
        setSharing(s);
        setPosition(p);
      }),
    [],
  );

  // Start/stop GPS sharing with the delivery lifecycle.
  const activeId = isActiveDelivery(delivery) ? delivery.id : null;
  useEffect(() => {
    if (activeId) {
      locationService.start(activeId);
    } else {
      locationService.stop();
    }
  }, [activeId]);

  // Stop on unmount (logout).
  useEffect(() => () => locationService.stop(), []);

  // The server may cancel the delivery (e.g. pharmacy/admin) - react to it.
  const orderId = delivery?.orderId;
  useEffect(() => {
    if (!orderId) {
      return;
    }
    return trackingSocket.onDeliveryStatus(e => {
      if (
        e.orderId === orderId &&
        ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(e.status)
      ) {
        refresh();
      }
    });
  }, [orderId, refresh]);

  const value = useMemo(
    () => ({
      delivery,
      loading,
      error,
      refresh,
      setDelivery,
      sharing,
      position,
    }),
    [delivery, loading, error, refresh, setDelivery, sharing, position],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveDelivery(): Value {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error(
      'useActiveDelivery must be used inside <ActiveDeliveryProvider>',
    );
  }
  return v;
}
