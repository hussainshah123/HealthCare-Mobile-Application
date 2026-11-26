import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { customersApi } from '../../../api/customers';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Loader,
  Screen,
  SectionTitle,
} from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { useAsync } from '../../../utils/useAsync';
import { useCustomerNav } from '../hooks/useCustomerNav';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

export function ProfileScreen() {
  const nav = useCustomerNav();
  const { user, logout, refreshUser } = useAuth();
  const profile = useAsync(() => customersApi.me());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = profile.data;
    setName((p?.name as string) ?? user?.name ?? '');
    setPhone((p?.phone as string) ?? user?.phone ?? '');
    setDob(p?.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '');
    setGender(p?.gender ?? undefined);
  }, [profile.data, user]);

  const save = async () => {
    if (dob && !DOB_RE.test(dob)) {
      Alert.alert('Invalid date', 'Use the format YYYY-MM-DD.');
      return;
    }
    setSaving(true);
    try {
      const updated = await customersApi.update({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        dateOfBirth: dob || undefined,
        gender,
      });
      profile.setData(updated);
      await refreshUser().catch(() => undefined);
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen refreshing={profile.refreshing} onRefresh={profile.refresh}>
      <View style={styles.header}>
        <Avatar uri={user?.avatarUrl} name={user?.name ?? '?'} size={64} />
        <View style={styles.headerText}>
          <Text style={typography.h2}>{user?.name}</Text>
          <Text style={typography.caption}>{user?.email}</Text>
        </View>
      </View>

      <Card onPress={() => nav.navigate('Addresses')}>
        <Text style={styles.link}>My addresses</Text>
      </Card>
      <Card onPress={() => nav.navigate('MyPrescriptions')}>
        <Text style={styles.link}>My prescriptions</Text>
      </Card>
      <Card onPress={() => nav.navigate('Notifications')}>
        <Text style={styles.link}>Notifications</Text>
      </Card>

      <SectionTitle>Personal details</SectionTitle>
      {profile.loading && !profile.data ? (
        <Loader />
      ) : (
        <>
          {profile.error ? (
            <Text style={styles.error}>{profile.error}</Text>
          ) : null}
          <Input label="Name" value={name} onChangeText={setName} />
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Date of birth"
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.row}>
            {GENDERS.map(g => (
              <Chip
                key={g}
                label={g.charAt(0) + g.slice(1).toLowerCase()}
                selected={gender === g}
                onPress={() => setGender(g)}
              />
            ))}
          </View>
          <Button title="Save changes" onPress={save} loading={saving} />
        </>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerText: { marginLeft: spacing.lg, flex: 1 },
  link: { ...typography.h3, color: colors.primaryDark },
  label: { ...typography.caption, fontWeight: '600', marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md },
  logout: { marginTop: spacing.xl },
});
