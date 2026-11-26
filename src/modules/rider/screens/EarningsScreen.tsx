import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ridersApi } from '../../../api/riders';
import {
  Card,
  EmptyState,
  ErrorState,
  Loader,
  SectionTitle,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';

export function EarningsScreen() {
  const earnings = useAsync(() => ridersApi.earnings());

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
      keyExtractor={i => i.deliveryId}
      refreshing={earnings.refreshing}
      onRefresh={earnings.refresh}
      ListHeaderComponent={
        <>
          <Card style={styles.summary}>
            <Text style={styles.label}>Total earnings</Text>
            <Text style={styles.total}>{formatMoney(e.total)}</Text>
            <Text style={typography.caption}>
              {e.deliveries} completed deliveries
            </Text>
          </Card>
          <SectionTitle>Per delivery</SectionTitle>
        </>
      }
      ListEmptyComponent={<EmptyState title="No earnings yet" />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.row}>
            <Text style={[typography.h3, styles.flex]}>
              Order #{item.orderNumber}
            </Text>
            <Text style={styles.fee}>{formatMoney(item.fee)}</Text>
          </View>
          <Text style={typography.caption}>
            {formatDateTime(item.deliveredAt)}
          </Text>
        </Card>
      )}
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
  label: { ...typography.caption, color: colors.primaryDark },
  total: { fontSize: 30, fontWeight: '800', color: colors.primaryDark },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  fee: { fontWeight: '700', color: colors.success },
});
