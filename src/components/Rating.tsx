import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../theme';

const STAR = '#F59E0B';

/** Filled SVG star followed by the rating value. */
export function Rating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Rated ${value.toFixed(1)} out of 5`}
    >
      <Star size={size} color={STAR} fill={STAR} strokeWidth={1.5} />
      <Text style={[styles.text, { fontSize: size }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { marginLeft: 4, fontWeight: '700', color: colors.text },
});
