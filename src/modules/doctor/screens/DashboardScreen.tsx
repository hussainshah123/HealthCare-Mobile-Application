import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentsApi } from '../../../api/appointments';
import { notificationSocket } from '../../../socket/notifications';
import {
  AccountStatusBanner,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  Screen,
  SectionTitle,
} from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';
import { isSameDay } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { Appointment } from '../../../types';
import { DoctorAppointmentItem } from '../components/DoctorAppointmentItem';
import { useAppointmentActions } from '../hooks/useAppointmentActions';

const ACTIVE = ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'];

export function DashboardScreen() {
  const { user } = useAuth();
  const list = useAsync(() => appointmentsApi.mine({ page: 1, limit: 100 }));
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

  const groups = useMemo(() => {
    const now = new Date();
    const items = list.data?.items ?? [];
    const byTime = (a: Appointment, b: Appointment) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    return {
      today: items
        .filter(
          a =>
            ACTIVE.includes(a.status) && isSameDay(new Date(a.startsAt), now),
        )
        .sort(byTime),
      upcoming: items
        .filter(
          a =>
            ACTIVE.includes(a.status) &&
            new Date(a.startsAt) > now &&
            !isSameDay(new Date(a.startsAt), now),
        )
        .sort(byTime),
      completed: items.filter(a => a.status === 'COMPLETED'),
      cancelled: items.filter(
        a => a.status === 'CANCELLED' || a.status === 'REJECTED',
      ),
      requested: items.filter(a => a.status === 'REQUESTED').length,
    };
  }, [list.data]);

  return (
    <Screen refreshing={list.refreshing} onRefresh={list.refresh}>
      <AccountStatusBanner status={user?.status} />
      <Text style={typography.h2}>Dr. {user?.name}</Text>
      {groups.requested ? (
        <Text style={styles.pending}>
          {groups.requested} appointment request
          {groups.requested > 1 ? 's' : ''} waiting for you
        </Text>
      ) : null}

      <View style={styles.stats}>
        <Stat label="Today" value={groups.today.length} />
        <Stat label="Upcoming" value={groups.upcoming.length} />
        <Stat label="Completed" value={groups.completed.length} />
        <Stat label="Cancelled" value={groups.cancelled.length} />
      </View>

      {list.loading && !list.data ? (
        <Loader />
      ) : list.error && !list.data ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (
        <>
          <SectionTitle>Today</SectionTitle>
          {groups.today.length ? (
            groups.today.map(a => (
              <DoctorAppointmentItem
                key={a.id}
                appointment={a}
                actions={actions}
              />
            ))
          ) : (
            <EmptyState title="No appointments today" />
          )}
          <SectionTitle>Upcoming</SectionTitle>
          {groups.upcoming.length ? (
            groups.upcoming
              .slice(0, 5)
              .map(a => (
                <DoctorAppointmentItem
                  key={a.id}
                  appointment={a}
                  actions={actions}
                />
              ))
          ) : (
            <Text style={typography.caption}>
              Nothing scheduled yet. Make sure your availability is set.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.small}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  pending: { color: colors.accent, fontWeight: '600', marginTop: spacing.xs },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  stat: { flex: 1, alignItems: 'center', padding: spacing.md },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
});
