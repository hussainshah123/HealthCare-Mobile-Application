import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { spacing, typography } from '../theme';
import { formatDateTime, humanize } from '../utils/format';
import type { Appointment } from '../types';

interface Props {
  appointment: Appointment;
  /** Name shown as the counterpart (doctor for customers, patient for doctors). */
  counterpart: string;
  subtitle?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export function AppointmentCard({
  appointment,
  counterpart,
  subtitle,
  onPress,
  children,
}: Props) {
  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={typography.h3}>{counterpart}</Text>
          {subtitle ? <Text style={typography.caption}>{subtitle}</Text> : null}
        </View>
        <StatusBadge status={appointment.status} />
      </View>
      <Text style={styles.meta}>
        {formatDateTime(appointment.startsAt)} · {humanize(appointment.type)}
      </Text>
      {appointment.reason ? (
        <Text style={typography.caption}>Reason: {appointment.reason}</Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1, marginRight: spacing.sm },
  meta: { ...typography.body, marginTop: spacing.sm, marginBottom: spacing.xs },
  actions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
});
