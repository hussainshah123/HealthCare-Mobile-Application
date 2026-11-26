import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { deliveriesApi } from '../../../api/deliveries';
import { trackingSocket } from '../../../socket/tracking';
import { getSocket } from '../../../socket/client';
import {
  Avatar,
  Banner,
  Button,
  ErrorState,
  Loader,
  StatusBadge,
} from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import {
  etaMinutes,
  formatDistance,
  haversineKm,
  toMapCoord,
} from '../../../utils/geo';
import { formatTime } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { LatLng } from '../../../types';
import type { CustomerScreenProps } from '../navigation/types';

interface RiderPos extends LatLng {
  heading: number | null;
  speed: number | null;
  recordedAt: string;
}

const FINISHED = ['DELIVERED', 'CANCELLED', 'RETURNED'];

export function LiveTrackingScreen({
  route,
  navigation,
}: CustomerScreenProps<'LiveTracking'>) {
  const { orderId } = route.params;
  const tracking = useAsync(() => deliveriesApi.tracking(orderId), [orderId]);
  const [rider, setRider] = useState<RiderPos | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Seed from REST.
  useEffect(() => {
    const t = tracking.data;
    if (t) {
      setStatus(t.delivery.status);
      if (t.lastLocation) {
        setRider({ ...t.lastLocation, speed: null });
      }
    }
  }, [tracking.data]);

  // Socket: join room, listen for location + status.
  useEffect(() => {
    const socket = getSocket('/tracking');
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const leave = trackingSocket.join(orderId, ack => {
      if (ack?.ok && ack.lastLocation) {
        const l = ack.lastLocation;
        setRider({
          lat: l.lat,
          lng: l.lng,
          heading: l.heading ?? null,
          speed: l.speed ?? null,
          recordedAt: l.recordedAt,
        });
      }
    });
    const offLoc = trackingSocket.onRiderLocation(e => {
      if (e.orderId === orderId) {
        setRider({
          lat: e.lat,
          lng: e.lng,
          heading: e.heading,
          speed: e.speed,
          recordedAt: e.recordedAt,
        });
      }
    });
    const offStatus = trackingSocket.onDeliveryStatus(e => {
      if (e.orderId === orderId) {
        setStatus(e.status);
      }
    });
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      offLoc();
      offStatus();
      leave();
    };
  }, [orderId]);

  const t = tracking.data;
  const destination = t?.destination;
  const pharmacy = t?.pharmacy;
  const beforePickup = status === 'ASSIGNED' || status === 'RIDER_ASSIGNED';

  // Route the rider still has to cover: via the pharmacy until pickup.
  const path = useMemo(() => {
    if (!destination) {
      return [];
    }
    const pts: LatLng[] = [];
    if (rider) {
      pts.push(rider);
    }
    if (beforePickup && pharmacy) {
      pts.push(pharmacy);
    }
    pts.push(destination);
    return pts;
  }, [rider, destination, pharmacy, beforePickup]);

  const distanceKm = useMemo(() => {
    let d = 0;
    for (let i = 1; i < path.length; i++) {
      d += haversineKm(path[i - 1], path[i]);
    }
    return d;
  }, [path]);

  // Keep everything in view.
  useEffect(() => {
    if (path.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(path.map(toMapCoord), {
        edgePadding: { top: 80, right: 60, bottom: 260, left: 60 },
        animated: true,
      });
    }
  }, [path]);

  if (tracking.loading) {
    return <Loader label="Loading tracking…" />;
  }
  if (tracking.error || !t) {
    return (
      <ErrorState
        message={
          tracking.error ?? 'Tracking is available once a rider is assigned.'
        }
        onRetry={tracking.reload}
      />
    );
  }

  const finished = status ? FINISHED.includes(status) : false;
  const initial = toMapCoord(rider ?? t.destination);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          ...initial,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {path.length > 1 ? (
          <Polyline
            coordinates={path.map(toMapCoord)}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        ) : null}
        <Marker
          coordinate={toMapCoord(t.destination)}
          title="Delivery address"
          description={t.destination.line1}
          pinColor={colors.danger}
        />
        {beforePickup ? (
          <Marker
            coordinate={toMapCoord(t.pharmacy)}
            title={t.pharmacy.name}
            description="Pickup"
            pinColor={colors.info}
          />
        ) : null}
        {rider ? (
          <Marker
            coordinate={toMapCoord(rider)}
            title={t.rider.name}
            description={`Updated ${formatTime(rider.recordedAt)}`}
            rotation={rider.heading ?? 0}
            flat
            pinColor={colors.primary}
          />
        ) : null}
      </MapView>

      <View style={styles.sheet}>
        {finished ? (
          <Banner
            tone={status === 'DELIVERED' ? 'success' : 'danger'}
            title={status === 'DELIVERED' ? 'Delivered' : 'Delivery ended'}
            message={
              status === 'DELIVERED'
                ? 'Your order has been delivered.'
                : undefined
            }
          />
        ) : null}
        <View style={styles.row}>
          <Avatar uri={t.rider.avatarUrl} name={t.rider.name} size={44} />
          <View style={styles.riderInfo}>
            <Text style={typography.h3}>{t.rider.name}</Text>
            <Text style={typography.caption}>
              {t.rider.vehicleNumber ?? 'Rider'}
            </Text>
          </View>
          {status ? <StatusBadge status={status} /> : null}
        </View>

        {!finished ? (
          <View style={styles.stats}>
            <Stat
              label="Distance"
              value={rider ? formatDistance(distanceKm) : '-'}
            />
            <Stat
              label="ETA"
              value={rider ? `${etaMinutes(distanceKm, rider.speed)} min` : '-'}
            />
            <Stat
              label="Live"
              value={connected ? 'Connected' : 'Reconnecting'}
            />
          </View>
        ) : null}
        {!rider && !finished ? (
          <Text style={typography.caption}>
            Waiting for the rider's location…
          </Text>
        ) : null}

        <View style={styles.actions}>
          {t.rider.phone ? (
            <Button
              title="Call rider"
              variant="outline"
              small
              onPress={() => Linking.openURL(`tel:${t.rider.phone}`)}
              style={styles.flex}
            />
          ) : null}
          <Button
            title="Order details"
            small
            onPress={() => navigation.navigate('OrderDetail', { orderId })}
            style={styles.flex}
          />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={typography.small}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  riderInfo: { flex: 1, marginLeft: spacing.md },
  stats: { flexDirection: 'row', marginVertical: spacing.md },
  stat: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
});
