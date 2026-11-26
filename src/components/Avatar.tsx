import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Avatar({
  uri,
  name,
  size = 56,
}: {
  uri?: string | null;
  name: string;
  size?: number;
}) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  return uri ? (
    <Image source={{ uri }} style={[styles.avatar, style]} />
  ) : (
    <View style={[styles.avatar, styles.placeholder, style]}>
      <Text style={[styles.initial, { fontSize: size / 2.4 }]}>
        {(name || '?').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.primaryLight },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primary, fontWeight: '700' },
});
