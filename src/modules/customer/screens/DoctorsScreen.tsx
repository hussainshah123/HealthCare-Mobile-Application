import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { doctorsApi } from '../../../api/doctors';
import {
  Chip,
  EmptyState,
  ErrorState,
  Input,
  Loader,
} from '../../../components';
import { colors, spacing } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { useAsync } from '../../../utils/useAsync';
import type { DoctorCard } from '../../../types';
import { DoctorListItem } from '../components/DoctorListItem';
import { useCustomerNav } from '../hooks/useCustomerNav';

const PAGE_SIZE = 20;
const FEE_FILTERS = [undefined, 1000, 2000, 3000];

export function DoctorsScreen() {
  const nav = useCustomerNav();
  const specs = useAsync(() => doctorsApi.specializations());
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [specializationId, setSpecializationId] = useState<
    string | undefined
  >();
  const [maxFee, setMaxFee] = useState<number | undefined>();
  const [items, setItems] = useState<DoctorCard[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

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
        const res = await doctorsApi.list({
          search: query,
          specializationId,
          maxFee,
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
        setMore(false);
        setRefreshing(false);
      }
    },
    [query, specializationId, maxFee],
  );

  useEffect(() => {
    fetchPage(1, 'initial');
  }, [fetchPage]);

  return (
    <View style={styles.root}>
      <View style={styles.filters}>
        <Input
          placeholder="Search doctors by name"
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            label="All"
            selected={!specializationId}
            onPress={() => setSpecializationId(undefined)}
          />
          {(specs.data ?? []).map(s => (
            <Chip
              key={s.id}
              label={s.name}
              selected={specializationId === s.id}
              onPress={() => setSpecializationId(s.id)}
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FEE_FILTERS.map(f => (
            <Chip
              key={String(f)}
              label={f ? `Fee ≤ ${f}` : 'Any fee'}
              selected={maxFee === f}
              onPress={() => setMaxFee(f)}
            />
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <Loader />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchPage(1, 'initial')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.list}
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
              title="No doctors found"
              message="Try changing the filters."
            />
          }
          ListFooterComponent={
            more ? <ActivityIndicator color={colors.primary} /> : undefined
          }
          renderItem={({ item }) => (
            <DoctorListItem
              doctor={item}
              onPress={() =>
                nav.navigate('DoctorDetail', { doctorId: item.id })
              }
            />
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
