import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentsApi } from '../../../api/appointments';
import { notificationSocket } from '../../../socket/notifications';
import { Chip, EmptyState, ErrorState, Loader } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useAsync } from '../../../utils/useAsync';
import type { AppointmentStatus } from '../../../types';
import { DoctorAppointmentItem } from '../components/DoctorAppointmentItem';
import { useAppointmentActions } from '../hooks/useAppointmentActions';

const FILTERS: { label: string; value?: AppointmentStatus }[] = [
  { label: 'Requests', value: 'REQUESTED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All' },
];

export function AppointmentsScreen() {
  const [status, setStatus] = useState<AppointmentStatus | undefined>(
    'REQUESTED',
  );
  const list = useAsync(
    () => appointmentsApi.mine({ status, page: 1, limit: 50 }),
    [status],
  );
  const actions = useAppointmentActions(() => list.refresh());

  useFocusEffect(
    useCallback(() => {
      list.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  useEffect(
    () => notificationSocket.onAppointmentUpdated(() => list.refresh()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const items = [...(list.data?.items ?? [])].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <View style={styles.root}>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map(f => (
            <Chip
              key={f.label}
              label={f.label}
              selected={status === f.value}
              onPress={() => setStatus(f.value)}
            />
          ))}
        </ScrollView>
      </View>
      {list.loading && !list.data ? (
        <Loader />
      ) : list.error && !list.data ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={a => a.id}
          contentContainerStyle={styles.list}
          refreshing={list.refreshing}
          onRefresh={list.refresh}
          ListEmptyComponent={<EmptyState title="No appointments" />}
          renderItem={({ item }) => (
            <DoctorAppointmentItem appointment={item} actions={actions} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filters: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
});
