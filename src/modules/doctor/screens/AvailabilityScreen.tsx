import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { doctorsApi } from '../../../api/doctors';
import {
  Button,
  Card,
  Chip,
  ErrorState,
  Input,
  Loader,
  Screen,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { useAsync } from '../../../utils/useAsync';
import type { AvailabilitySlot, SlotMinutes } from '../../../types';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const SLOT_OPTIONS: SlotMinutes[] = [15, 20, 30, 60];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Row = AvailabilitySlot & { key: string };
let seq = 0;
const withKey = (s: AvailabilitySlot): Row => ({ ...s, key: `r${seq++}` });

export function AvailabilityScreen() {
  const remote = useAsync(() => doctorsApi.availability());
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (remote.data) {
      setRows(
        remote.data.map(s =>
          withKey({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime.slice(0, 5),
            endTime: s.endTime.slice(0, 5),
            slotMinutes: s.slotMinutes,
          }),
        ),
      );
      setDirty(false);
    }
  }, [remote.data]);

  const update = (key: string, patch: Partial<AvailabilitySlot>) => {
    setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)));
    setDirty(true);
  };
  const add = (dayOfWeek: number) => {
    setRows(rs => [
      ...rs,
      withKey({
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        slotMinutes: 30,
      }),
    ]);
    setDirty(true);
  };
  const remove = (key: string) => {
    setRows(rs => rs.filter(r => r.key !== key));
    setDirty(true);
  };

  const validate = (): string | null => {
    for (const r of rows) {
      if (!TIME_RE.test(r.startTime) || !TIME_RE.test(r.endTime)) {
        return `${DAYS[r.dayOfWeek]}: use HH:MM (24h) times.`;
      }
      if (r.startTime >= r.endTime) {
        return `${DAYS[r.dayOfWeek]}: end time must be after start time.`;
      }
    }
    for (let d = 0; d < 7; d++) {
      const day = rows
        .filter(r => r.dayOfWeek === d)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < day.length; i++) {
        if (day[i].startTime < day[i - 1].endTime) {
          return `${DAYS[d]}: time ranges overlap.`;
        }
      }
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Check your availability', err);
      return;
    }
    setSaving(true);
    try {
      await doctorsApi.setAvailability(rows.map(({ key: _key, ...s }) => s));
      setDirty(false);
      Alert.alert('Saved', 'Patients can now book these slots.');
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (remote.loading && !remote.data) {
    return <Loader />;
  }
  if (remote.error && !remote.data) {
    return <ErrorState message={remote.error} onRetry={remote.reload} />;
  }

  return (
    <Screen
      refreshing={remote.refreshing}
      onRefresh={remote.refresh}
      footer={
        <Button
          title={dirty ? 'Save availability' : 'Saved'}
          onPress={save}
          loading={saving}
          disabled={!dirty}
        />
      }
    >
      <Text style={[typography.caption, styles.intro]}>
        Set the weekly hours you are available. Patients see bookable slots of
        the chosen length.
      </Text>
      {DAYS.map((name, day) => {
        const dayRows = rows.filter(r => r.dayOfWeek === day);
        return (
          <Card key={name}>
            <View style={styles.dayHeader}>
              <Text style={typography.h3}>{name}</Text>
              <Button
                title="+ Add hours"
                small
                variant="ghost"
                onPress={() => add(day)}
              />
            </View>
            {dayRows.length === 0 ? (
              <Text style={typography.caption}>Unavailable</Text>
            ) : null}
            {dayRows.map(r => (
              <View key={r.key} style={styles.range}>
                <View style={styles.times}>
                  <Input
                    label="From"
                    value={r.startTime}
                    onChangeText={v => update(r.key, { startTime: v })}
                    placeholder="09:00"
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                    style={styles.timeInput}
                  />
                  <Input
                    label="To"
                    value={r.endTime}
                    onChangeText={v => update(r.key, { endTime: v })}
                    placeholder="17:00"
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                    style={styles.timeInput}
                  />
                  <Button
                    title="Remove"
                    small
                    variant="ghost"
                    onPress={() => remove(r.key)}
                  />
                </View>
                <View style={styles.chips}>
                  {SLOT_OPTIONS.map(m => (
                    <Chip
                      key={m}
                      label={`${m} min`}
                      selected={r.slotMinutes === m}
                      onPress={() => update(r.key, { slotMinutes: m })}
                    />
                  ))}
                </View>
              </View>
            ))}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.md },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  range: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  times: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeInput: { width: 90 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
