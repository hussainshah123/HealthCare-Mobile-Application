import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ridersApi } from '../../../api/riders';
import {
  AccountStatusBanner,
  Avatar,
  Button,
  Chip,
  ErrorState,
  Input,
  Loader,
  Screen,
  SectionTitle,
} from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { useAsync } from '../../../utils/useAsync';

const VEHICLES = ['MOTORCYCLE', 'BICYCLE', 'CAR'];
/** Pakistani CNIC: 12345-1234567-1 */
const CNIC_RE = /^\d{5}-\d{7}-\d$/;

function formatCnic(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) {
    return d;
  }
  if (d.length <= 12) {
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  }
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const profile = useAsync(() => ridersApi.me());
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const p = profile.data;
    if (p) {
      setVehicleType(p.vehicleType ?? '');
      setVehicleNumber(p.vehicleNumber ?? '');
      setLicenseNumber(p.licenseNumber ?? '');
      setCnic(p.cnic ?? '');
    }
  }, [profile.data]);

  const save = async () => {
    if (cnic && !CNIC_RE.test(cnic)) {
      Alert.alert('Invalid CNIC', 'Use the format 12345-1234567-1.');
      return;
    }
    setSaving(true);
    try {
      const updated = await ridersApi.update({
        vehicleType: vehicleType || undefined,
        vehicleNumber: vehicleNumber.trim().toUpperCase() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        cnic: cnic || undefined,
      });
      profile.setData(p => ({ ...p, ...updated }));
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      await refreshUser();
    } catch (e) {
      Alert.alert('Could not refresh', getErrorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  if (profile.loading && !profile.data) {
    return <Loader />;
  }
  if (profile.error && !profile.data) {
    return <ErrorState message={profile.error} onRetry={profile.reload} />;
  }

  return (
    <Screen refreshing={profile.refreshing} onRefresh={profile.refresh}>
      <AccountStatusBanner status={user?.status} />
      {user?.status === 'PENDING' ? (
        <Button
          title="Check approval status"
          variant="outline"
          small
          onPress={checkStatus}
          loading={checking}
          style={styles.mb}
        />
      ) : null}
      <View style={styles.header}>
        <Avatar uri={user?.avatarUrl} name={user?.name ?? '?'} size={64} />
        <View style={styles.headerText}>
          <Text style={typography.h2}>{user?.name}</Text>
          <Text style={typography.caption}>
            {user?.email} · {user?.phone}
          </Text>
        </View>
      </View>

      <SectionTitle>Vehicle</SectionTitle>
      <View style={styles.chips}>
        {VEHICLES.map(v => (
          <Chip
            key={v}
            label={v.charAt(0) + v.slice(1).toLowerCase()}
            selected={vehicleType === v}
            onPress={() => setVehicleType(v)}
          />
        ))}
      </View>
      <Input
        label="Vehicle registration number"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        autoCapitalize="characters"
        placeholder="LEA-1234"
      />
      <SectionTitle>Documents</SectionTitle>
      <Input
        label="Driving licence number"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
        autoCapitalize="characters"
      />
      <Input
        label="CNIC"
        value={cnic}
        onChangeText={v => setCnic(formatCnic(v))}
        keyboardType="number-pad"
        placeholder="12345-1234567-1"
        maxLength={15}
      />
      <Text style={styles.note}>
        Location: while you have an active delivery, your GPS position is shared
        with the customer and pharmacy so they can follow the order. Sharing
        stops automatically when the delivery is completed or cancelled.
      </Text>
      <Button title="Save profile" onPress={save} loading={saving} />
      <Button
        title="Sign out"
        variant="danger"
        onPress={logout}
        style={styles.logout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  mb: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerText: { marginLeft: spacing.lg, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  logout: { marginTop: spacing.xl },
});
