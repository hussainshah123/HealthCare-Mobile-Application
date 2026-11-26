import React, { useState } from 'react';
import { Alert, FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import { prescriptionsApi } from '../../../api/prescriptions';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Loader,
  StatusBadge,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { formatDate } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { DoctorPrescription, Prescription } from '../../../types';
import type { CustomerScreenProps } from '../navigation/types';

type Tab = 'uploaded' | 'doctor';

export function MyPrescriptionsScreen({
  navigation,
}: CustomerScreenProps<'MyPrescriptions'>) {
  const [tab, setTab] = useState<Tab>('doctor');
  const uploaded = useAsync(() => prescriptionsApi.mine());
  const fromDoctors = useAsync(() => prescriptionsApi.doctorPrescriptions());
  const current = tab === 'uploaded' ? uploaded : fromDoctors;

  return (
    <View style={styles.root}>
      <View style={styles.tabs}>
        <Chip
          label="From doctors"
          selected={tab === 'doctor'}
          onPress={() => setTab('doctor')}
        />
        <Chip
          label="Uploaded"
          selected={tab === 'uploaded'}
          onPress={() => setTab('uploaded')}
        />
      </View>
      {current.loading && !current.data ? (
        <Loader />
      ) : current.error && !current.data ? (
        <ErrorState message={current.error} onRetry={current.reload} />
      ) : tab === 'uploaded' ? (
        <FlatList<Prescription>
          data={uploaded.data ?? []}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          refreshing={uploaded.refreshing}
          onRefresh={uploaded.refresh}
          ListEmptyComponent={
            <EmptyState
              title="No uploaded prescriptions"
              actionLabel="Upload prescription"
              onAction={() => navigation.navigate('UploadPrescription')}
            />
          }
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Text style={[typography.h3, styles.flex]}>
                  Uploaded {formatDate(item.createdAt)}
                </Text>
                <StatusBadge status={item.status} />
              </View>
              {item.notes ? (
                <Text style={typography.caption}>{item.notes}</Text>
              ) : null}
              {item.reviewNote ? (
                <Text style={typography.caption}>
                  Pharmacist: {item.reviewNote}
                </Text>
              ) : null}
              {item.fileUrl ? (
                <Button
                  title="Open file"
                  variant="ghost"
                  small
                  style={styles.left}
                  onPress={() =>
                    Linking.openURL(item.fileUrl).catch(() =>
                      Alert.alert('Cannot open file'),
                    )
                  }
                />
              ) : null}
            </Card>
          )}
        />
      ) : (
        <FlatList<DoctorPrescription>
          data={fromDoctors.data ?? []}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          refreshing={fromDoctors.refreshing}
          onRefresh={fromDoctors.refresh}
          ListEmptyComponent={
            <EmptyState
              title="No prescriptions yet"
              message="Prescriptions written by your doctor after a consultation show up here."
            />
          }
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Text style={[typography.h3, styles.flex]}>
                  {item.diagnosis}
                </Text>
                <Text style={typography.caption}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              {item.doctor?.name || item.doctorName ? (
                <Text style={typography.caption}>
                  Dr. {item.doctor?.name ?? item.doctorName}
                </Text>
              ) : null}
              {item.items?.map((m, i) => (
                <View key={`${m.medicineName}-${i}`} style={styles.med}>
                  <Text style={styles.medName}>
                    {m.medicineName} · {m.dosage}
                  </Text>
                  <Text style={typography.caption}>
                    {m.frequency} for {m.durationDays} day
                    {m.durationDays === 1 ? '' : 's'}
                    {m.instructions ? ` · ${m.instructions}` : ''}
                  </Text>
                </View>
              ))}
              {item.notes ? (
                <Text style={[typography.caption, styles.notes]}>
                  Notes: {item.notes}
                </Text>
              ) : null}
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  flex: { flex: 1 },
  left: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  med: {
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
  },
  medName: { fontWeight: '600', color: colors.text },
  notes: { marginTop: spacing.sm },
});
