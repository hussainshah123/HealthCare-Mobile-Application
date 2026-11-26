import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Button, MedicalBackdrop } from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';

export function UnsupportedRoleScreen() {
  const { user, logout } = useAuth();
  return (
    <MedicalBackdrop>
      <StatusBar barStyle="dark-content" />
      <View style={styles.root}>
        <Text style={typography.h2}>Use the web dashboard</Text>
        <Text style={styles.msg}>
          {user?.role === 'PHARMACY' ? 'Pharmacy' : 'Admin'} accounts are
          managed from the web dashboard. This app is for customers, doctors and
          riders.
        </Text>
        <Button title="Sign out" onPress={logout} variant="outline" />
      </View>
    </MedicalBackdrop>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  msg: {
    ...typography.body,
    color: colors.textMuted,
    marginVertical: spacing.lg,
  },
});
