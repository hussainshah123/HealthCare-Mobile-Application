import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { catalogueApi } from '../../../api/catalogue';
import { EmptyState, ErrorState, Input, Loader } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import type { Medicine } from '../../../types';
import { MedicineCard } from '../components/MedicineCard';
import type { CustomerScreenProps } from '../navigation/types';

const PAGE_SIZE = 20;

export function MedicineListScreen({
  route,
  navigation,
}: CustomerScreenProps<'MedicineList'>) {
  const { categoryId } = route.params;
  const [search, setSearch] = useState(route.params.search ?? '');
  const [query, setQuery] = useState(route.params.search ?? '');
  const [items, setItems] = useState<Medicine[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p: number, mode: 'initial' | 'more' | 'refresh') => {
      if (mode === 'initial') {
        setLoading(true);
      } else if (mode === 'more') {
        setLoadingMore(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const res = await catalogueApi.medicines({
          search: query,
          categoryId,
          page: p,
          limit: PAGE_SIZE,
        });
        setItems(prev => (p === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setPage(p);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [query, categoryId],
  );

  useEffect(() => {
    fetchPage(1, 'initial');
  }, [fetchPage]);

  // debounce search typing
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadMore = () => {
    if (!loadingMore && !loading && items.length < total) {
      fetchPage(page + 1, 'more');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.searchBar}>
        <Input
          placeholder="Search medicines"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>
      {loading ? (
        <Loader />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchPage(1, 'initial')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={m => m.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            total > 0 ? (
              <Text style={styles.count}>
                {total} product{total === 1 ? '' : 's'}
              </Text>
            ) : undefined
          }
          renderItem={({ item }) => (
            <MedicineCard
              medicine={item}
              onPress={() =>
                navigation.navigate('MedicineDetail', { medicineId: item.id })
              }
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPage(1, 'refresh')}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No medicines found"
              message={query ? 'Try a different search term.' : undefined}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.more} />
            ) : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  count: { ...typography.caption, marginBottom: spacing.sm },
  more: { marginVertical: spacing.lg },
});
