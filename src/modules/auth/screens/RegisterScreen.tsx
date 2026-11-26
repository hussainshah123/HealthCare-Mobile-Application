import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin, MapPinOff } from 'lucide-react-native';
import { Button, Chip, Input, Screen } from '../../../components';
import {
  getCurrentPosition,
  requestLocationPermission,
} from '../../../utils/location';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import type { RegisterBody } from '../../../types';

type AppRole = Extract<RegisterBody['role'], 'CUSTOMER' | 'DOCTOR' | 'RIDER'>;

const ROLES: { value: AppRole; label: string; hint: string }[] = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    hint: 'Order medicines and consult doctors.',
  },
  {
    value: 'DOCTOR',
    label: 'Doctor',
    hint: 'Offer consultations. Requires admin approval.',
  },
  {
    value: 'RIDER',
    label: 'Rider',
    hint: 'Deliver orders. Requires admin approval.',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LocState =
  | { status: 'locating' }
  | { status: 'ok'; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'error' };

const LOCATION_TEXT: Record<LocState['status'], string> = {
  locating: 'Getting your location…',
  ok: 'Location added. We will use it for your delivery address and nearby services.',
  denied: 'Location is off. You can still sign up and add your address later.',
  error: "Couldn't get your location. You can still sign up.",
};

export function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole] = useState<AppRole>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loc, setLoc] = useState<LocState>({ status: 'locating' });

  // Fetch the phone's location as soon as the form opens (asks permission once).
  const locate = useCallback(async () => {
    setLoc({ status: 'locating' });
    try {
      if (!(await requestLocationPermission())) {
        setLoc({ status: 'denied' });
        return;
      }
      const pos = await getCurrentPosition();
      setLoc({
        status: 'ok',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch {
      setLoc({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) {
      e.name = 'Enter your full name';
    }
    if (!EMAIL_RE.test(email.trim())) {
      e.email = 'Enter a valid email';
    }
    if (phone.replace(/\D/g, '').length < 10) {
      e.phone = 'Enter a valid phone number';
    }
    if (password.length < 8) {
      e.password = 'At least 8 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }
    setLoading(true);
    setServerError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
        ...(loc.status === 'ok' ? { lat: loc.lat, lng: loc.lng } : {}),
      });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Registration failed'));
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.label}>I am a</Text>
      <View style={styles.roles}>
        {ROLES.map(r => (
          <Chip
            key={r.value}
            label={r.label}
            selected={role === r.value}
            onPress={() => setRole(r.value)}
          />
        ))}
      </View>
      <Text style={styles.hint}>{ROLES.find(r => r.value === role)?.hint}</Text>

      <Input
        label="Full name"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={errors.email}
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="03XX XXXXXXX"
        error={errors.phone}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />
      <View style={styles.locRow}>
        {loc.status === 'ok' ? (
          <MapPin size={16} color={colors.primary} style={styles.locIcon} />
        ) : loc.status === 'locating' ? null : (
          <MapPinOff
            size={16}
            color={colors.textMuted}
            style={styles.locIcon}
          />
        )}
        <Text style={[styles.locText, loc.status === 'ok' && styles.locOk]}>
          {LOCATION_TEXT[loc.status]}
        </Text>
        {loc.status === 'denied' || loc.status === 'error' ? (
          <Button title="Try again" variant="ghost" small onPress={locate} />
        ) : null}
      </View>
      {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
      <Button
        title="Create account"
        onPress={submit}
        loading={loading}
        disabled={loc.status === 'locating'}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.caption, fontWeight: '600', marginBottom: spacing.sm },
  roles: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { ...typography.caption, marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locIcon: { marginRight: 6 },
  locText: { ...typography.caption, flex: 1 },
  locOk: { color: colors.primaryDark },
});
