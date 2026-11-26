import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { doctorsApi } from '../../../api/doctors';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  Loader,
  Row,
  Screen,
  SectionTitle,
  Rating,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { formatDate, formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { CustomerScreenProps } from '../navigation/types';

export function DoctorDetailScreen({
  route,
  navigation,
}: CustomerScreenProps<'DoctorDetail'>) {
  const { doctorId } = route.params;
  const doc = useAsync(() => doctorsApi.get(doctorId), [doctorId]);

  if (doc.loading) {
    return <Loader />;
  }
  if (doc.error || !doc.data) {
    return (
      <ErrorState message={doc.error ?? 'Not found'} onRetry={doc.reload} />
    );
  }
  const d = doc.data;

  return (
    <Screen
      refreshing={doc.refreshing}
      onRefresh={doc.refresh}
      footer={
        <Button
          title={`Book appointment · ${formatMoney(d.fee)}`}
          onPress={() =>
            navigation.navigate('BookAppointment', {
              doctorId: d.id,
              doctorName: d.name,
              fee: d.fee,
            })
          }
        />
      }
    >
      <View style={styles.header}>
        <Avatar uri={d.avatarUrl} name={d.name} size={80} />
        <View style={styles.headerText}>
          <Text style={typography.h2}>{d.name}</Text>
          <Text style={typography.caption}>{d.specialization}</Text>
          {d.rating != null ? (
            <Rating value={Number(d.rating)} size={16} />
          ) : null}
        </View>
      </View>
      <Card>
        <Row label="Experience" value={`${d.experienceYears} years`} />
        <Row label="Consultation fee" value={formatMoney(d.fee)} />
        <Row label="Qualifications" value={d.qualifications || '-'} />
        <Row label="PMDC / Reg. no." value={d.registrationNumber || '-'} />
        {d.languages?.length ? (
          <Row label="Languages" value={d.languages.join(', ')} />
        ) : null}
      </Card>
      {d.bio ? (
        <>
          <SectionTitle>About</SectionTitle>
          <Text style={typography.body}>{d.bio}</Text>
        </>
      ) : null}
      <SectionTitle>Reviews</SectionTitle>
      {d.reviews?.length ? (
        d.reviews.map((r, i) => (
          <Card key={`${r.customerName}-${r.createdAt}-${i}`}>
            <View style={styles.reviewHead}>
              <Text style={typography.h3}>{r.customerName}</Text>
              <Rating value={Number(r.rating)} />
            </View>
            {r.comment ? (
              <Text style={typography.body}>{r.comment}</Text>
            ) : null}
            <Text style={typography.small}>{formatDate(r.createdAt)}</Text>
          </Card>
        ))
      ) : (
        <Text style={typography.caption}>No reviews yet.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerText: { flex: 1, marginLeft: spacing.lg },
  rating: { color: colors.warning, fontWeight: '700' },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between' },
});
