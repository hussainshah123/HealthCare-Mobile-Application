import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { deliveriesApi } from '../../../api/deliveries';
import {
  Button,
  EmptyState,
  Input,
  Loader,
  StatusBadge,
} from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { formatMoney } from '../../../utils/format';
import {
  etaMinutes,
  formatDistance,
  haversineKm,
  toMapCoord,
} from '../../../utils/geo';
import type { LatLng } from '../../../types';
import { sharingLabel } from '../components/ActiveDeliveryCard';
import { useActiveDelivery } from '../hooks/ActiveDeliveryContext';
import type { RiderScreenProps } from '../navigation/types';

/** Opens turn-by-turn navigation in Google Maps (falls back to the browser / Apple Maps). */
async function openNavigation(dest: LatLng, label: string) {
  const ll = `${dest.lat},${dest.lng}`;
  const candidates =
    Platform.OS === 'android'
      ? [`google.navigation:q=${ll}&mode=d`]
      : [
          `comgooglemaps://?daddr=${ll}&directionsmode=driving`,
          `http://maps.apple.com/?daddr=${ll}&q=${encodeURIComponent(label)}`,
        ];
  for (const url of candidates) {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // try next
    }
  }
  await Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=driving`,
  );
}

export function ActiveDeliveryScreen({
  navigation,
}: RiderScreenProps<'ActiveDelivery'>) {
  const { delivery, loading, setDelivery, refresh, sharing, position } =
    useActiveDelivery();
  const [busy, setBusy] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const mapRef = useRef<MapView>(null);

  const target = useMemo<LatLng | null>(() => {
    if (!delivery) {
      return null;
    }
    return delivery.status === 'ASSIGNED'
      ? { lat: delivery.pharmacy.lat, lng: delivery.pharmacy.lng }
      : { lat: delivery.dropoff.lat, lng: delivery.dropoff.lng };
  }, [delivery]);

  const distanceKm = position && target ? haversineKm(position, target) : null;

  useEffect(() => {
    if (!delivery || !mapRef.current) {
      return;
    }
    const pts = [
      { lat: delivery.pharmacy.lat, lng: delivery.pharmacy.lng },
      { lat: delivery.dropoff.lat, lng: delivery.dropoff.lng },
      ...(position ? [position] : []),
    ];
    mapRef.current.fitToCoordinates(pts.map(toMapCoord), {
      edgePadding: { top: 60, right: 50, bottom: 340, left: 50 },
      animated: true,
    });
    // only refit when the delivery changes or we get the first fix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.id, delivery?.status, !!position]);

  if (loading) {
    return <Loader />;
  }
  if (!delivery) {
    return (
      <EmptyState
        title="No active delivery"
        message="Accept an available order to start."
        actionLabel="Back"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const act = async (key: string, fn: () => Promise<typeof delivery>) => {
    setBusy(key);
    try {
      const updated = await fn();
      if (
        updated &&
        (updated.status === 'DELIVERED' || updated.status === 'CANCELLED')
      ) {
        setDelivery(null); // stops location sharing
        Alert.alert(
          updated.status === 'DELIVERED' ? 'Delivered' : 'Delivery cancelled',
          updated.status === 'DELIVERED'
            ? `Great job! You earned ${formatMoney(updated.fee)}.`
            : undefined,
        );
        navigation.goBack();
      } else if (updated) {
        setDelivery(updated);
      } else {
        await refresh();
      }
    } catch (e) {
      Alert.alert('Action failed', getErrorMessage(e));
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const reject = () =>
    Alert.alert(
      'Release this delivery?',
      'It will be offered to another rider.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: async () => {
            setBusy('reject');
            try {
              await deliveriesApi.reject(delivery.id);
              setDelivery(null);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Could not release', getErrorMessage(e));
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );

  const route: LatLng[] = [
    ...(position ? [position] : []),
    ...(delivery.status === 'ASSIGNED'
      ? [{ lat: delivery.pharmacy.lat, lng: delivery.pharmacy.lng }]
      : []),
    { lat: delivery.dropoff.lat, lng: delivery.dropoff.lng },
  ];

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        initialRegion={{
          ...toMapCoord(target ?? delivery.dropoff),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={toMapCoord(delivery.pharmacy)}
          title={delivery.pharmacy.name}
          description="Pickup"
          pinColor={colors.info}
        />
        <Marker
          coordinate={toMapCoord(delivery.dropoff)}
          title={delivery.customerName}
          description={delivery.dropoff.line1}
          pinColor={colors.danger}
        />
        {route.length > 1 ? (
          <Polyline
            coordinates={route.map(toMapCoord)}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        ) : null}
      </MapView>

      <View style={styles.sheet}>
        <View style={styles.row}>
          <Text style={[typography.h3, styles.flex]}>
            Order #{delivery.orderNumber}
          </Text>
          <StatusBadge status={delivery.status} />
        </View>
        <Text style={typography.caption}>
          {delivery.status === 'ASSIGNED'
            ? `Pick up at ${delivery.pharmacy.name}, ${delivery.pharmacy.address}`
            : `Deliver to ${delivery.customerName}: ${delivery.dropoff.line1}, ${delivery.dropoff.city}`}
        </Text>
        {distanceKm != null ? (
          <Text style={typography.caption}>
            {formatDistance(distanceKm)} away · ~
            {etaMinutes(distanceKm, position?.speed)} min
          </Text>
        ) : null}
        <Text
          style={[
            styles.sharing,
            {
              color:
                sharing.status === 'sharing' ? colors.success : colors.warning,
            },
          ]}
        >
          {sharingLabel(sharing)}
        </Text>
        {sharing.status === 'denied' ? (
          <Button
            title="Open settings"
            small
            variant="ghost"
            onPress={() => Linking.openSettings()}
            style={styles.left}
          />
        ) : null}

        {target ? (
          <Button
            title={
              delivery.status === 'ASSIGNED'
                ? 'Navigate to pharmacy'
                : 'Navigate to customer'
            }
            variant="secondary"
            onPress={() =>
              openNavigation(
                target,
                delivery.status === 'ASSIGNED'
                  ? delivery.pharmacy.name
                  : delivery.dropoff.line1,
              ).catch(() => Alert.alert('Could not open maps'))
            }
            style={styles.mt}
          />
        ) : null}

        {delivery.status === 'ASSIGNED' ? (
          <View style={styles.actions}>
            <Button
              title="Release"
              variant="outline"
              onPress={reject}
              loading={busy === 'reject'}
              style={styles.flex}
            />
            <Button
              title="Picked up"
              onPress={() =>
                act('pickup', () => deliveriesApi.pickup(delivery.id))
              }
              loading={busy === 'pickup'}
              style={styles.flex}
            />
          </View>
        ) : null}
        {delivery.status === 'PICKED_UP' ? (
          <Button
            title="Start delivery"
            onPress={() => act('start', () => deliveriesApi.start(delivery.id))}
            loading={busy === 'start'}
            style={styles.mt}
          />
        ) : null}
        {delivery.status === 'ON_THE_WAY' ? (
          <View style={styles.mt}>
            <Input
              label="Customer OTP"
              value={otp}
              onChangeText={v => setOtp(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={8}
              placeholder="Ask the customer for their code"
            />
            <Button
              title="Complete delivery"
              disabled={otp.length < 4}
              onPress={() =>
                act('complete', () => deliveriesApi.complete(delivery.id, otp))
              }
              loading={busy === 'complete'}
            />
          </View>
        ) : null}
      </View>
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
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  flex: { flex: 1 },
  sharing: { marginTop: spacing.xs, fontWeight: '600', fontSize: 13 },
  left: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  mt: { marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
