import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ordersApi } from '../../../api/orders';
import { trackingSocket } from '../../../socket/tracking';
import {
  Banner,
  Button,
  Card,
  ErrorState,
  Loader,
  Row,
  Screen,
  SectionTitle,
  StatusBadge,
} from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { formatDateTime, formatMoney, humanize } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { OrderStatus } from '../../../types';
import type { CustomerScreenProps } from '../navigation/types';

const TRACKABLE: OrderStatus[] = ['RIDER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'];
const CANCELLABLE: OrderStatus[] = [
  'PENDING',
  'PRESCRIPTION_UNDER_REVIEW',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
];

export function OrderDetailScreen({
  route,
  navigation,
}: CustomerScreenProps<'OrderDetail'>) {
  const { orderId } = route.params;
  const order = useAsync(() => ordersApi.get(orderId), [orderId]);
  const [busy, setBusy] = useState<'cancel' | 'reorder' | null>(null);

  useFocusEffect(
    useCallback(() => {
      order.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Live status updates while the order is in delivery.
  const status = order.data?.status;
  const inDelivery = !!status && TRACKABLE.includes(status);
  useEffect(() => {
    if (!inDelivery) {
      return;
    }
    const leave = trackingSocket.join(orderId);
    const off = trackingSocket.onDeliveryStatus(e => {
      if (e.orderId === orderId) {
        order.refresh();
      }
    });
    return () => {
      off();
      leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, inDelivery]);

  if (order.loading && !order.data) {
    return <Loader />;
  }
  if (order.error && !order.data) {
    return <ErrorState message={order.error} onRetry={order.reload} />;
  }
  const o = order.data!;

  const cancel = () =>
    Alert.alert('Cancel order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setBusy('cancel');
          try {
            order.setData(
              await ordersApi.cancel(o.id, 'Cancelled by customer'),
            );
            order.refresh();
          } catch (e) {
            Alert.alert('Could not cancel', getErrorMessage(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  const reorder = async () => {
    setBusy('reorder');
    try {
      await ordersApi.reorder(o.id);
      navigation.navigate('Cart');
    } catch (e) {
      Alert.alert('Could not reorder', getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const history = [...(o.history ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Screen refreshing={order.refreshing} onRefresh={order.refresh}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={typography.h2}>#{o.orderNumber}</Text>
          <Text style={typography.caption}>
            {o.pharmacy?.name} · {formatDateTime(o.createdAt)}
          </Text>
        </View>
        <StatusBadge status={o.status} />
      </View>

      {o.deliveryOtp ? (
        <Card style={styles.otpCard}>
          <Text style={styles.otpLabel}>Delivery OTP</Text>
          <Text style={styles.otp}>{o.deliveryOtp}</Text>
          <Text style={typography.caption}>
            Share this code with the rider only when you receive your order.
          </Text>
        </Card>
      ) : null}

      {o.status === 'PRESCRIPTION_UNDER_REVIEW' ? (
        <Banner
          tone="info"
          title="Prescription under review"
          message="The pharmacy is checking your prescription."
        />
      ) : null}

      {TRACKABLE.includes(o.status) ? (
        <Button
          title="Track delivery live"
          onPress={() => navigation.navigate('LiveTracking', { orderId: o.id })}
        />
      ) : null}

      <SectionTitle>Items</SectionTitle>
      <Card>
        {o.items.map(i => (
          <Row
            key={i.medicineId}
            label={`${i.name} x${i.quantity}`}
            value={formatMoney(i.price * i.quantity)}
          />
        ))}
        <View style={styles.divider} />
        <Row label="Subtotal" value={formatMoney(o.subtotal)} />
        <Row label="Delivery fee" value={formatMoney(o.deliveryFee)} />
        {o.discount ? (
          <Row label="Discount" value={`- ${formatMoney(o.discount)}`} />
        ) : null}
        <Row label="Total" value={formatMoney(o.total)} bold />
        <Row
          label="Payment"
          value={`${humanize(o.paymentMethod)} · ${humanize(
            o.paymentStatus ?? '',
          )}`}
        />
      </Card>

      {o.address ? (
        <>
          <SectionTitle>Delivery address</SectionTitle>
          <Card>
            {o.address.label ? (
              <Text style={typography.h3}>{o.address.label}</Text>
            ) : null}
            <Text style={typography.body}>
              {[o.address.line1, o.address.line2, o.address.city]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </Card>
        </>
      ) : null}

      <SectionTitle>Status history</SectionTitle>
      <Card>
        {history.length === 0 ? (
          <Text style={typography.caption}>No updates yet.</Text>
        ) : null}
        {history.map((h, idx) => (
          <View key={`${h.status}-${h.createdAt}`} style={styles.timelineRow}>
            <View style={[styles.dot, idx === 0 && styles.dotActive]} />
            <View style={styles.flex}>
              <Text style={[typography.body, idx === 0 && styles.bold]}>
                {humanize(h.status)}
              </Text>
              <Text style={typography.caption}>
                {formatDateTime(h.createdAt)}
              </Text>
              {h.note ? <Text style={typography.caption}>{h.note}</Text> : null}
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        {CANCELLABLE.includes(o.status) ? (
          <Button
            title="Cancel order"
            variant="outline"
            onPress={cancel}
            loading={busy === 'cancel'}
          />
        ) : null}
        {o.status === 'DELIVERED' || o.status === 'CANCELLED' ? (
          <Button
            title="Reorder"
            onPress={reorder}
            loading={busy === 'reorder'}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  flex: { flex: 1 },
  otpCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  otpLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  otp: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 8,
    color: colors.primaryDark,
    marginVertical: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  timelineRow: { flexDirection: 'row', marginBottom: spacing.md },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: 6,
    marginRight: spacing.md,
  },
  dotActive: { backgroundColor: colors.primary },
  bold: { fontWeight: '700' },
  actions: { gap: spacing.md, marginTop: spacing.md },
});
