import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, StatusBadge } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { formatMoney } from '../../../utils/format';
import type { Delivery } from '../../../types';
import type { SharingState } from '../services/locationService';

export function sharingLabel(s: SharingState): string {
  switch (s.status) {
    case 'sharing':
      return s.via === 'socket'
        ? 'Sharing live location'
        : 'Sharing location (fallback)';
    case 'starting':
      return 'Starting location sharing…';
    case 'denied':
      return 'Location permission denied - customer cannot track you';
    case 'error':
      return `Location error: ${s.message}`;
    default:
      return 'Location sharing off';
  }
}

export function ActiveDeliveryCard({
  delivery,
  sharing,
  onOpen,
}: {
  delivery: Delivery;
  sharing: SharingState;
  onOpen: () => void;
}) {
  const ok = sharing.status === 'sharing';
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={[typography.h3, styles.flex]}>
          Order #{delivery.orderNumber}
        </Text>
        <StatusBadge status={delivery.status} />
      </View>
      <Text style={typography.caption}>Pickup: {delivery.pharmacy.name}</Text>
      <Text style={typography.caption}>
        Drop-off: {delivery.dropoff.line1}, {delivery.dropoff.city}
      </Text>
      <Text style={typography.caption}>
        Customer: {delivery.customerName} · Fee {formatMoney(delivery.fee)}
      </Text>
      <Text
        style={[
          styles.sharing,
          { color: ok ? colors.success : colors.warning },
        ]}
      >
        {sharingLabel(sharing)}
      </Text>
      <Button title="Open delivery" onPress={onOpen} style={styles.btn} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: colors.primary, borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  flex: { flex: 1 },
  sharing: { marginTop: spacing.sm, fontWeight: '600', fontSize: 13 },
  btn: { marginTop: spacing.md },
});
