import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import { formatMoney } from '../../../utils/format';
import type { Medicine } from '../../../types';

export function MedicineCard({
  medicine,
  onPress,
}: {
  medicine: Medicine;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.card}>
      {medicine.imageUrl ? (
        <Image source={{ uri: medicine.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>{medicine.name.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={typography.h3} numberOfLines={1}>
          {medicine.name}
        </Text>
        <Text style={typography.caption} numberOfLines={1}>
          {[medicine.brand, medicine.dosage].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>
            {medicine.minPrice != null
              ? `from ${formatMoney(medicine.minPrice)}`
              : 'Not in stock'}
          </Text>
          {medicine.requiresPrescription ? (
            <Text style={styles.rx}>Rx</Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 24, fontWeight: '700', color: colors.primary },
  body: { flex: 1, marginLeft: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  price: { color: colors.primaryDark, fontWeight: '600', flex: 1 },
  rx: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
  },
});
