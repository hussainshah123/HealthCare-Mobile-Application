import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductArt } from '../../../components/ProductArt';
import { colors, radius, spacing } from '../../../theme';
import { formatMoney } from '../../../utils/format';
import type { Medicine } from '../../../types';

/** Grid tile: product picture, name, pack size, price and tags. */
export function MedicineCard({
  medicine,
  onPress,
  width,
}: {
  medicine: Medicine;
  onPress: () => void;
  /** Fixed width for horizontal lists; grids let it flex. */
  width?: number;
}) {
  const inStock = medicine.minPrice != null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${medicine.name}${
        inStock ? `, from ${formatMoney(medicine.minPrice!)}` : ', not in stock'
      }${medicine.requiresPrescription ? ', prescription required' : ''}`}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : styles.flex,
        pressed && styles.pressed,
      ]}
    >
      <View>
        <ProductArt
          form={medicine.form}
          colorKey={medicine.name}
          imageUrl={medicine.imageUrl}
          size={110}
        />
        <View style={styles.tags}>
          {medicine.form ? (
            <Text style={styles.tag}>{medicine.form}</Text>
          ) : null}
          {medicine.requiresPrescription ? (
            <Text style={[styles.tag, styles.rx]}>Rx</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {medicine.name}
      </Text>
      <Text style={styles.pack} numberOfLines={1}>
        {medicine.packSize ?? medicine.brand ?? ' '}
      </Text>
      <View style={styles.footer}>
        {inStock ? (
          <Text style={styles.price}>
            <Text style={styles.from}>from </Text>
            {formatMoney(medicine.minPrice!)}
          </Text>
        ) : (
          <Text style={styles.out}>Out of stock</Text>
        )}
        <View style={[styles.plus, !inStock && styles.plusOff]}>
          <Text style={styles.plusText}>+</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  // flex in a 2-column grid; capped so a lone last card stays half width
  flex: { flex: 1, maxWidth: '48.5%' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  tags: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  rx: { color: '#fff', backgroundColor: colors.danger },
  name: {
    marginTop: spacing.sm,
    paddingHorizontal: 2,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    minHeight: 36,
  },
  pack: {
    paddingHorizontal: 2,
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: 2,
  },
  from: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  price: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  out: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  plus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusOff: { backgroundColor: colors.border },
  plusText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: -2 },
});
