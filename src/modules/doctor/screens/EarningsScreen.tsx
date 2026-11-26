import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { doctorsApi } from '../../../api/doctors';
import {
  Card,
  EmptyState,
  ErrorState,
  Loader,
  Row,
  SectionTitle,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';

/** API.md leaves earnings `items` untyped, so read common field names defensively. */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  return undefined;
}

export function EarningsScreen() {
  const earnings = useAsync(() => doctorsApi.earnings());

  if (earnings.loading && !earnings.data) {
    return <Loader />;
  }
  if (earnings.error && !earnings.data) {
    return <ErrorState message={earnings.error} onRetry={earnings.reload} />;
  }
  const e = earnings.data!;

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={e.items ?? []}
      keyExtractor={(item, i) =>
        String(pick(item, 'id', 'consultationId', 'appointmentId') ?? i)
      }
      refreshing={earnings.refreshing}
      onRefresh={earnings.refresh}
      ListHeaderComponent={
        <>
          <Card style={styles.summary}>
            <Text style={styles.netLabel}>Net earnings</Text>
            <Text style={styles.net}>{formatMoney(e.net)}</Text>
            <Row label="Gross" value={formatMoney(e.gross)} />
            <Row
              label="Platform commission"
              value={`- ${formatMoney(e.commission)}`}
            />
            <Row label="Consultations" value={String(e.consultations)} />
          </Card>
          <SectionTitle>History</SectionTitle>
        </>
      }
      ListEmptyComponent={
        <EmptyState
          title="No earnings yet"
          message="Completed consultations appear here."
        />
      }
      renderItem={({ item }) => {
        const amount = pick(item, 'net', 'amount', 'fee') as number | undefined;
        const name = pick(item, 'customerName', 'patientName') as
          | string
          | undefined;
        const when = pick(
          item,
          'completedAt',
          'endedAt',
          'startsAt',
          'createdAt',
        ) as string | undefined;
        return (
          <Card>
            <View style={styles.itemRow}>
              <Text style={[typography.h3, styles.flex]}>
                {name ?? 'Consultation'}
              </Text>
              <Text style={styles.amount}>{formatMoney(amount)}</Text>
            </View>
            {when ? (
              <Text style={typography.caption}>{formatDateTime(when)}</Text>
            ) : null}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  summary: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  netLabel: { ...typography.caption, color: colors.primaryDark },
  net: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  amount: { fontWeight: '700', color: colors.success },
});
