import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { appointmentsApi } from '../../../api/appointments';
import { doctorsApi } from '../../../api/doctors';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  Screen,
  SectionTitle,
} from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import { getErrorMessage, getErrorStatus } from '../../../utils/errors';
import {
  DAY_NAMES,
  formatMoney,
  formatTime,
  toYmd,
} from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { AppointmentType, Slot } from '../../../types';
import type { CustomerScreenProps } from '../navigation/types';

const TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'CHAT', label: 'Chat' },
];

export function BookAppointmentScreen({
  route,
  navigation,
}: CustomerScreenProps<'BookAppointment'>) {
  const { doctorId, doctorName, fee } = route.params;
  const days = useMemo(() => {
    const out: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);
  const [day, setDay] = useState(days[0]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [type, setType] = useState<AppointmentType>('VIDEO');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  const date = toYmd(day);
  const slots = useAsync(
    () => doctorsApi.slots(doctorId, date),
    [doctorId, date],
  );
  const now = Date.now();
  const visibleSlots = (slots.data ?? []).filter(
    s => new Date(s.startsAt).getTime() > now,
  );

  const book = async () => {
    if (!slot) {
      return;
    }
    setBooking(true);
    try {
      await appointmentsApi.create({
        doctorId,
        startsAt: slot.startsAt,
        type,
        reason: reason.trim() || undefined,
      });
      Alert.alert(
        'Appointment requested',
        `Dr. ${doctorName} will confirm your appointment shortly.`,
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs', params: { screen: 'Appointments' } }],
      });
    } catch (e) {
      if (getErrorStatus(e) === 409) {
        Alert.alert(
          'Slot taken',
          'Someone just booked this slot. Please pick another time.',
        );
        setSlot(null);
        slots.reload();
      } else {
        Alert.alert('Booking failed', getErrorMessage(e));
      }
    } finally {
      setBooking(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          title={
            slot
              ? `Book ${formatTime(slot.startsAt)} · ${formatMoney(fee)}`
              : 'Select a time slot'
          }
          onPress={book}
          disabled={!slot}
          loading={booking}
        />
      }
    >
      <Text style={typography.h2}>Dr. {doctorName}</Text>
      <SectionTitle>Date</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map(d => {
          const sel = toYmd(d) === date;
          return (
            <Pressable
              key={toYmd(d)}
              accessibilityRole="button"
              style={[styles.day, sel && styles.daySel]}
              onPress={() => {
                setDay(d);
                setSlot(null);
              }}
            >
              <Text style={[styles.dayName, sel && styles.daySelText]}>
                {DAY_NAMES[d.getDay()]}
              </Text>
              <Text style={[styles.dayNum, sel && styles.daySelText]}>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionTitle>Available slots</SectionTitle>
      {slots.loading ? (
        <Loader />
      ) : slots.error ? (
        <ErrorState message={slots.error} onRetry={slots.reload} />
      ) : visibleSlots.length === 0 ? (
        <EmptyState title="No slots on this day" message="Try another date." />
      ) : (
        <View style={styles.slots}>
          {visibleSlots.map(s => (
            <Chip
              key={s.startsAt}
              label={formatTime(s.startsAt)}
              disabled={!s.available}
              selected={slot?.startsAt === s.startsAt}
              onPress={() => setSlot(s)}
            />
          ))}
        </View>
      )}

      <SectionTitle>Consultation type</SectionTitle>
      <View style={styles.slots}>
        {TYPES.map(t => (
          <Chip
            key={t.value}
            label={t.label}
            selected={type === t.value}
            onPress={() => setType(t.value)}
          />
        ))}
      </View>
      <Input
        label="Reason (optional)"
        value={reason}
        onChangeText={setReason}
        multiline
        placeholder="Describe your symptoms"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  day: {
    width: 56,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  daySel: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayName: { fontSize: 12, color: colors.textMuted },
  dayNum: { fontSize: 18, fontWeight: '700', color: colors.text },
  daySelText: { color: colors.white },
  slots: { flexDirection: 'row', flexWrap: 'wrap' },
});
