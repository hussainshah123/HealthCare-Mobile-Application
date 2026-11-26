import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ordersApi } from '../../../api/orders';
import {
  Card,
  EmptyState,
  ErrorState,
  Loader,
  StatusBadge,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import { useCustomerNav } from '../hooks/useCustomerNav';

export function OrdersScreen() {
  const nav = useCustomerNav();
  const orders = useAsync(() => ordersApi.mine({ page: 1, limit: 50 }));

  useFocusEffect(
    useCallback(() => {
      orders.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (orders.loading && !orders.data) {
    return <Loader />;
  }
  if (orders.error && !orders.data) {
    return <ErrorState message={orders.error} onRetry={orders.reload} />;
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.list}
      data={orders.data?.items ?? []}
      keyExtractor={o => o.id}
      refreshing={orders.refreshing}
      onRefresh={orders.refresh}
      ListEmptyComponent={
        <EmptyState
          title="No orders yet"
          message="Your medicine orders will appear here."
          actionLabel="Browse medicines"
          onAction={() =>
            nav.navigate('MedicineList', { title: 'All medicines' })
          }
        />
      }
      renderItem={({ item }) => (
        <Card onPress={() => nav.navigate('OrderDetail', { orderId: item.id })}>
          <View style={styles.row}>
            <Text style={[typography.h3, styles.flex]}>
              #{item.orderNumber}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={typography.caption}>
            {item.pharmacy?.name} · {item.items.length} item
            {item.items.length === 1 ? '' : 's'}
          </Text>
          <View style={styles.row}>
            <Text style={[typography.caption, styles.flex]}>
              {formatDateTime(item.createdAt)}
            </Text>
            <Text style={styles.total}>{formatMoney(item.total)}</Text>
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
  total: { fontWeight: '700', color: colors.text },
});
