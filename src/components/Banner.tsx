import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Tone = 'warning' | 'info' | 'danger' | 'success';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  warning: { bg: '#FFF4D6', fg: '#7A5500' },
  info: { bg: '#E5EFFD', fg: colors.info },
  danger: { bg: '#FBE7E7', fg: colors.danger },
  success: { bg: '#E3F5EA', fg: colors.success },
};

export function Banner({
  title,
  message,
  tone = 'info',
}: {
  title: string;
  message?: string;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <Text style={[styles.title, { color: t.fg }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: t.fg }]}>{message}</Text>
      ) : null}
    </View>
  );
}

/** Shown for doctors/riders whose account is not yet approved by an admin. */
export function AccountStatusBanner({ status }: { status?: string | null }) {
  if (status === 'PENDING') {
    return (
      <Banner
        tone="warning"
        title="Pending approval"
        message="An admin is reviewing your profile. Complete your details below; you can start working once your account is approved."
      />
    );
  }
  if (status === 'REJECTED' || status === 'SUSPENDED') {
    return (
      <Banner
        tone="danger"
        title={status === 'REJECTED' ? 'Account rejected' : 'Account suspended'}
        message="Please contact support for more information."
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { fontWeight: '700', fontSize: 15 },
  message: { fontSize: 13, marginTop: 2 },
});
