import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../../../components/BrandMark';
import { MedicalBackdrop } from '../../../components/MedicalBackdrop';
import { colors, spacing } from '../../../theme';

export function SplashScreen() {
  return (
    <MedicalBackdrop tone="dark">
      <View style={styles.root}>
        <BrandMark size={88} />
        <Text style={styles.logo}>MediGo</Text>
        <Text style={styles.tag}>Medicines, doctors and delivery</Text>
        <ActivityIndicator color={colors.white} style={styles.spinner} />
      </View>
    </MedicalBackdrop>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  tag: { color: colors.primaryLight, marginTop: spacing.sm },
  spinner: { marginTop: spacing.xl },
});
