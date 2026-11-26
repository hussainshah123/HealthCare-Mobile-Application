import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { consultationsApi } from '../../../api/consultations';
import { Button, Card, Input, Screen, SectionTitle } from '../../../components';
import { spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import type { DoctorPrescriptionItem } from '../../../types';
import type { DoctorScreenProps } from '../navigation/types';

type ItemForm = {
  key: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  instructions: string;
};
let seq = 0;
const newItem = (): ItemForm => ({
  key: `i${seq++}`,
  medicineName: '',
  dosage: '',
  frequency: '',
  durationDays: '',
  instructions: '',
});

export function WritePrescriptionScreen({
  route,
  navigation,
}: DoctorScreenProps<'WritePrescription'>) {
  const { consultationId, patientName } = route.params;
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([newItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: string, patch: Partial<ItemForm>) =>
    setItems(list => list.map(i => (i.key === key ? { ...i, ...patch } : i)));

  const submit = async () => {
    if (!diagnosis.trim()) {
      setError('Diagnosis is required.');
      return;
    }
    const filled = items.filter(i => i.medicineName.trim());
    const parsed: DoctorPrescriptionItem[] = [];
    for (const i of filled) {
      const days = parseInt(i.durationDays, 10);
      if (!i.dosage.trim() || !i.frequency.trim() || !days || days < 1) {
        setError(
          `Complete dosage, frequency and duration for ${i.medicineName}.`,
        );
        return;
      }
      parsed.push({
        medicineName: i.medicineName.trim(),
        dosage: i.dosage.trim(),
        frequency: i.frequency.trim(),
        durationDays: days,
        instructions: i.instructions.trim() || undefined,
      });
    }
    if (parsed.length === 0) {
      setError('Add at least one medicine.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await consultationsApi.writePrescription(consultationId, {
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        items: parsed,
      });
      Alert.alert(
        'Prescription sent',
        `${patientName} can now see it in their app.`,
      );
      navigation.navigate('Tabs', { screen: 'Dashboard' });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button title="Send prescription" onPress={submit} loading={saving} />
      }
    >
      <Text style={typography.caption}>Patient: {patientName}</Text>
      <SectionTitle>Diagnosis</SectionTitle>
      <Input
        value={diagnosis}
        onChangeText={setDiagnosis}
        placeholder="e.g. Acute pharyngitis"
      />
      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Advice, follow-up, tests…"
      />

      <SectionTitle>Medicines</SectionTitle>
      {items.map((i, idx) => (
        <Card key={i.key}>
          <View style={styles.itemHeader}>
            <Text style={typography.h3}>Medicine {idx + 1}</Text>
            {items.length > 1 ? (
              <Button
                title="Remove"
                small
                variant="ghost"
                onPress={() =>
                  setItems(list => list.filter(x => x.key !== i.key))
                }
              />
            ) : null}
          </View>
          <Input
            label="Name"
            value={i.medicineName}
            onChangeText={v => update(i.key, { medicineName: v })}
            placeholder="Amoxicillin"
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Input
                label="Dosage"
                value={i.dosage}
                onChangeText={v => update(i.key, { dosage: v })}
                placeholder="500 mg"
              />
            </View>
            <View style={styles.flex}>
              <Input
                label="Frequency"
                value={i.frequency}
                onChangeText={v => update(i.key, { frequency: v })}
                placeholder="3x daily"
              />
            </View>
          </View>
          <Input
            label="Duration (days)"
            value={i.durationDays}
            onChangeText={v =>
              update(i.key, { durationDays: v.replace(/\D/g, '') })
            }
            keyboardType="number-pad"
            placeholder="7"
          />
          <Input
            label="Instructions (optional)"
            value={i.instructions}
            onChangeText={v => update(i.key, { instructions: v })}
            placeholder="After meals"
          />
        </Card>
      ))}
      <Button
        title="+ Add medicine"
        variant="outline"
        onPress={() => setItems(list => [...list, newItem()])}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  error: { color: '#D64545', marginTop: spacing.md },
});
