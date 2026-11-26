import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { humanize } from '../utils/format';

const GREEN = new Set([
  'DELIVERED',
  'COMPLETED',
  'APPROVED',
  'ACTIVE',
  'CONFIRMED',
  'PAID',
]);
const RED = new Set([
  'CANCELLED',
  'REJECTED',
  'SUSPENDED',
  'RETURNED',
  'FAILED',
  'ENDED',
]);
const BLUE = new Set([
  'ON_THE_WAY',
  'PICKED_UP',
  'IN_PROGRESS',
  'RIDER_ASSIGNED',
  'ASSIGNED',
]);

function tone(status: string) {
  if (GREEN.has(status)) {
    return { bg: '#E3F5EA', fg: colors.success };
  }
  if (RED.has(status)) {
    return { bg: '#FBE7E7', fg: colors.danger };
  }
  if (BLUE.has(status)) {
    return { bg: '#E5EFFD', fg: colors.info };
  }
  return { bg: '#FFF4D6', fg: '#9A6B00' };
}

export function StatusBadge({ status }: { status: string }) {
  const t = tone(status);
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{humanize(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
