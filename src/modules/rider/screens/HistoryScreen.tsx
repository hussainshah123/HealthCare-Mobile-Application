import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { deliveriesApi } from '../../../api/deliveries';
import {
  Card,
  EmptyState,
  ErrorState,
  Loader,
  StatusBadge,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { formatDateTime, formatMoney } from '../../../utils/format';
import type { Delivery } from '../../../types';

const PAGE_SIZE = 20;

export function HistoryScreen() {
  const [items, setItems] = useState<Delivery[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p: number, mode: 'initial' | 'more' | 'refresh') => {
      if (mode === 'initial') {
        setLoading(true);
      } else if (mode === 'more') {
        setMore(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const res = await deliveriesApi.history({ page: p, limit: PAGE_SIZE });
        setItems(prev => (p === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setPage(p);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
        setMore(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchPage(1, 'initial');
  }, [fetchPage]);

  if (loading) {
    return <Loader />;
  }
  if (error && items.length === 0) {
    return (
      <ErrorState message={error} onRetry={() => fetchPage(1, 'initial')} />
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={d => d.id}
      refreshing={refreshing}
      onRefresh={() => fetchPage(1, 'refresh')}
      onEndReached={() => {
        if (!more && items.length < total) {
          fetchPage(page + 1, 'more');
        }
      }}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        <EmptyState
          title="No deliveries yet"
          message="Completed deliveries appear here."
        />
      }
      ListFooterComponent={
        more ? <ActivityIndicator color={colors.primary} /> : undefined
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.row}>
            <Text style={[typography.h3, styles.flex]}>
              Order #{item.orderNumber}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={typography.caption}>
            {item.pharmacy.name} → {item.dropoff.line1}, {item.dropoff.city}
          </Text>
          <View style={styles.row}>
            <Text style={[typography.small, styles.flex]}>
              {formatDateTime(item.deliveredAt ?? item.assignedAt)}
            </Text>
            <Text style={styles.fee}>{formatMoney(item.fee)}</Text>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  flex: { flex: 1 },
  fee: { fontWeight: '700', color: colors.success },
});
