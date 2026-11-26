import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Card, Rating } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { formatMoney } from '../../../utils/format';
import type { DoctorCard } from '../../../types';

export function DoctorListItem({
  doctor,
  onPress,
}: {
  doctor: DoctorCard;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <Avatar uri={doctor.avatarUrl} name={doctor.name} />
      <View style={styles.body}>
        <Text style={typography.h3} numberOfLines={1}>
          {doctor.name}
        </Text>
        <Text style={typography.caption}>
          {doctor.specialization} · {doctor.experienceYears} yrs
        </Text>
        <View style={styles.footer}>
          <Text style={styles.fee}>{formatMoney(doctor.fee)}</Text>
          {doctor.rating != null ? (
            <Rating value={Number(doctor.rating)} />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  body: { flex: 1, marginLeft: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  fee: { color: colors.primaryDark, fontWeight: '600' },
  rating: { color: colors.warning, fontWeight: '600' },
});
