import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

/** Label/value row used in summaries. */
export function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[styles.value, bold && styles.bold]}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
  },
  bold: { fontWeight: '700', color: colors.text, fontSize: 16 },
  section: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
