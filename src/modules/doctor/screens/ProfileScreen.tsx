import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { doctorsApi } from '../../../api/doctors';
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
import { spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { useAsync } from '../../../utils/useAsync';

export function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const data = useAsync(async () => {
    const [profile, specializations] = await Promise.all([
      doctorsApi.me(),
      doctorsApi.specializations(),
    ]);
    return { profile, specializations };
  });
  const [specializationId, setSpecializationId] = useState<
    string | undefined
  >();
  const [qualifications, setQualifications] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const p = data.data?.profile;
    if (!p) {
      return;
    }
    setSpecializationId(
      p.specializationId ??
        data.data?.specializations.find(s => s.name === p.specialization)?.id ??
        undefined,
    );
    setQualifications(p.qualifications ?? '');
    setRegistrationNumber(p.registrationNumber ?? '');
    setExperienceYears(
      p.experienceYears != null ? String(p.experienceYears) : '',
    );
    setFee(p.fee != null ? String(p.fee) : '');
    setBio(p.bio ?? '');
    setLanguages((p.languages ?? []).join(', '));
  }, [data.data]);

  const save = async () => {
    const feeNum = fee ? Number(fee) : undefined;
    const expNum = experienceYears ? parseInt(experienceYears, 10) : undefined;
    if (feeNum !== undefined && (Number.isNaN(feeNum) || feeNum < 0)) {
      Alert.alert('Invalid fee');
      return;
    }
    setSaving(true);
    try {
      const updated = await doctorsApi.updateMe({
        specializationId,
        qualifications: qualifications.trim() || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
        experienceYears: expNum,
        fee: feeNum,
        bio: bio.trim() || undefined,
        languages: languages
          .split(',')
          .map(l => l.trim())
          .filter(Boolean),
      });
      data.setData(d => (d ? { ...d, profile: updated } : d));
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

  if (data.loading && !data.data) {
    return <Loader />;
  }
  if (data.error && !data.data) {
    return <ErrorState message={data.error} onRetry={data.reload} />;
  }
  const status = user?.status ?? data.data?.profile.status;

  return (
    <Screen refreshing={data.refreshing} onRefresh={data.refresh}>
      <AccountStatusBanner status={status} />
      {status === 'PENDING' ? (
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
          <Text style={typography.h2}>Dr. {user?.name}</Text>
          <Text style={typography.caption}>
            {user?.email} · {user?.phone}
          </Text>
        </View>
      </View>

      <SectionTitle>Specialization</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.mb}
      >
        {(data.data?.specializations ?? []).map(s => (
          <Chip
            key={s.id}
            label={s.name}
            selected={specializationId === s.id}
            onPress={() => setSpecializationId(s.id)}
          />
        ))}
      </ScrollView>

      <Input
        label="Qualifications"
        value={qualifications}
        onChangeText={setQualifications}
        placeholder="MBBS, FCPS (Medicine)"
      />
      <Input
        label="PMDC registration number"
        value={registrationNumber}
        onChangeText={setRegistrationNumber}
        autoCapitalize="characters"
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input
            label="Experience (years)"
            value={experienceYears}
            onChangeText={v => setExperienceYears(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.flex}>
          <Input
            label="Consultation fee (PKR)"
            value={fee}
            onChangeText={v => setFee(v.replace(/[^\d.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Input
        label="Languages (comma separated)"
        value={languages}
        onChangeText={setLanguages}
        placeholder="English, Urdu"
      />
      <Input label="Bio" value={bio} onChangeText={setBio} multiline />
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
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  logout: { marginTop: spacing.xl },
});
