import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentsApi } from '../../../api/appointments';
import { notificationSocket } from '../../../socket/notifications';
import {
  AppointmentCard,
  Button,
  EmptyState,
  ErrorState,
  Loader,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { useAsync } from '../../../utils/useAsync';
import type { Appointment } from '../../../types';
import { useCustomerNav } from '../hooks/useCustomerNav';

export function AppointmentsScreen() {
  const nav = useCustomerNav();
  const list = useAsync(() => appointmentsApi.mine({ page: 1, limit: 50 }));
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      list.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Live updates (doctor accepted / started the consultation).
  useEffect(
    () => notificationSocket.onAppointmentUpdated(() => list.refresh()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const cancel = (a: Appointment) =>
    Alert.alert('Cancel appointment?', undefined, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel appointment',
        style: 'destructive',
        onPress: async () => {
          setBusy(a.id);
          try {
            await appointmentsApi.cancel(a.id, 'Cancelled by patient');
            list.refresh();
          } catch (e) {
            Alert.alert('Could not cancel', getErrorMessage(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  if (list.loading && !list.data) {
    return <Loader />;
  }
  if (list.error && !list.data) {
    return <ErrorState message={list.error} onRetry={list.reload} />;
  }

  const items = [...(list.data?.items ?? [])].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={a => a.id}
      refreshing={list.refreshing}
      onRefresh={list.refresh}
      ListEmptyComponent={
        <EmptyState
          title="No appointments"
          message="Book a consultation with a doctor."
          actionLabel="Find a doctor"
          onAction={() => nav.navigate('Tabs', { screen: 'Doctors' })}
        />
      }
      renderItem={({ item }) => {
        const canJoin =
          !!item.consultationId &&
          (item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS');
        return (
          <AppointmentCard
            appointment={item}
            counterpart={`Dr. ${item.doctor.name}`}
            subtitle={item.doctor.specialization}
          >
            {canJoin ? (
              <Button
                title="Join consultation"
                small
                onPress={() =>
                  nav.navigate('Consultation', {
                    consultationId: item.consultationId!,
                    title: `Dr. ${item.doctor.name}`,
                    type: item.type,
                  })
                }
              />
            ) : null}
            {item.status === 'CONFIRMED' && !item.consultationId ? (
              <Text style={typography.caption}>
                The doctor will start the consultation at the scheduled time.
              </Text>
            ) : null}
            {item.status === 'COMPLETED' ? (
              <Button
                title="Prescriptions"
                small
                variant="outline"
                onPress={() => nav.navigate('MyPrescriptions')}
              />
            ) : null}
            {item.status === 'REQUESTED' || item.status === 'CONFIRMED' ? (
              <Button
                title="Cancel"
                small
                variant="ghost"
                loading={busy === item.id}
                onPress={() => cancel(item)}
              />
            ) : null}
          </AppointmentCard>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
});
