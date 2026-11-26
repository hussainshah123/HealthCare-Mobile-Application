import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deliveriesApi } from '../../../api/deliveries';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
} from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { formatDistance, haversineKm } from '../../../utils/geo';
import { useAsync } from '../../../utils/useAsync';
import type { AvailableDelivery } from '../../../types';
import { useActiveDelivery } from '../hooks/ActiveDeliveryContext';
import { useRiderNav } from '../hooks/useRiderNav';

/** GET /deliveries/available returns orders; the order id is what /accept expects. */
const orderIdOf = (d: AvailableDelivery) => d.orderId ?? d.id;

export function AvailableDeliveriesScreen() {
  const nav = useRiderNav();
  const { user } = useAuth();
  const active = useActiveDelivery();
  const list = useAsync(() => deliveriesApi.available());
  const [accepting, setAccepting] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      list.refresh();
      const t = setInterval(() => list.refresh(), 30000);
      return () => clearInterval(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const accept = async (d: AvailableDelivery) => {
    const id = orderIdOf(d);
    setAccepting(id);
    try {
      const delivery = await deliveriesApi.accept(id);
      active.setDelivery(delivery);
      nav.navigate('ActiveDelivery');
    } catch (e) {
      Alert.alert('Could not accept', getErrorMessage(e));
      list.refresh();
    } finally {
      setAccepting(null);
    }
  };

  if (user?.status !== 'ACTIVE') {
    return (
      <View style={styles.root}>
        <View style={styles.list}>
          <Banner
            tone="warning"
            title="Pending approval"
            message="You can accept deliveries once an admin approves your account."
          />
        </View>
      </View>
    );
  }
  if (list.loading && !list.data) {
    return <Loader />;
  }
  if (list.error && !list.data) {
    return <ErrorState message={list.error} onRetry={list.reload} />;
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={list.data ?? []}
      keyExtractor={d => d.id}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
      ListHeaderComponent={
        active.delivery ? (
          <Banner
            tone="info"
            title="You have an active delivery"
            message="Complete it before accepting another order."
          />
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState
          title="No orders waiting"
          message="Make sure you're online. This list refreshes automatically."
        />
      }
      renderItem={({ item }) => {
        const drop =
          item.dropoff ??
          (item.address?.lat != null && item.address?.lng != null
            ? {
                line1: item.address.line1 ?? '',
                city: item.address.city ?? '',
                lat: item.address.lat,
                lng: item.address.lng,
              }
            : undefined);
        const pharmacy = item.pharmacy;
        const km =
          drop && pharmacy?.lat != null && pharmacy?.lng != null
            ? haversineKm(
                { lat: pharmacy.lat, lng: pharmacy.lng },
                { lat: drop.lat, lng: drop.lng },
              )
            : null;
        const fee = item.fee ?? item.deliveryFee;
        return (
          <Card>
            <View style={styles.row}>
              <Text style={[typography.h3, styles.flex]}>
                {item.orderNumber ? `Order #${item.orderNumber}` : 'Order'}
              </Text>
              {fee != null ? (
                <Text style={styles.fee}>{formatMoney(fee)}</Text>
              ) : null}
            </View>
            {pharmacy ? (
              <Text style={typography.caption}>
                Pickup: {pharmacy.name}
                {pharmacy.address ? `, ${pharmacy.address}` : ''}
              </Text>
            ) : null}
            {drop ? (
              <Text style={typography.caption}>
                Drop-off: {[drop.line1, drop.city].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {km != null ? (
              <Text style={typography.caption}>
                Trip distance ≈ {formatDistance(km)}
              </Text>
            ) : null}
            {item.createdAt ? (
              <Text style={typography.small}>
                {formatDateTime(item.createdAt)}
              </Text>
            ) : null}
            <Button
              title="Accept"
              onPress={() => accept(item)}
              loading={accepting === orderIdOf(item)}
              disabled={
                !!active.delivery ||
                (!!accepting && accepting !== orderIdOf(item))
              }
              style={styles.btn}
            />
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  flex: { flex: 1 },
  fee: { fontWeight: '700', color: colors.success },
  btn: { marginTop: spacing.md },
});
