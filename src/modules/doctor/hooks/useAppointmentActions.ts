import { useState } from 'react';
import { Alert } from 'react-native';
import { appointmentsApi } from '../../../api/appointments';
import { consultationsApi } from '../../../api/consultations';
import { getErrorMessage } from '../../../utils/errors';
import type { Appointment } from '../../../types';
import { useDoctorNav } from './useDoctorNav';

/** Accept / reject / cancel / start-or-open consultation for a doctor's appointment. */
export function useAppointmentActions(onChanged: () => void) {
  const nav = useDoctorNav();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (
    id: string,
    fn: () => Promise<unknown>,
    errTitle: string,
  ) => {
    setBusyId(id);
    try {
      await fn();
      onChanged();
    } catch (e) {
      Alert.alert(errTitle, getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const accept = (a: Appointment) =>
    run(a.id, () => appointmentsApi.accept(a.id), 'Could not accept');

  const reject = (a: Appointment) =>
    Alert.alert('Reject appointment?', `${a.customer.name} will be notified.`, [
      { text: 'Back', style: 'cancel' },
      {
        text: 'Not available at this time',
        onPress: () =>
          run(
            a.id,
            () => appointmentsApi.reject(a.id, 'Not available at this time'),
            'Could not reject',
          ),
      },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () =>
          run(a.id, () => appointmentsApi.reject(a.id), 'Could not reject'),
      },
    ]);

  const cancel = (a: Appointment) =>
    Alert.alert('Cancel appointment?', `${a.customer.name} will be notified.`, [
      { text: 'Back', style: 'cancel' },
      {
        text: 'Cancel appointment',
        style: 'destructive',
        onPress: () =>
          run(
            a.id,
            () => appointmentsApi.cancel(a.id, 'Cancelled by doctor'),
            'Could not cancel',
          ),
      },
    ]);

  /** Starts the consultation (CONFIRMED) or re-opens it (IN_PROGRESS). */
  const openConsultation = async (a: Appointment) => {
    setBusyId(a.id);
    try {
      const consultationId =
        a.status === 'IN_PROGRESS' && a.consultationId
          ? a.consultationId
          : (await consultationsApi.start(a.id)).id;
      onChanged();
      nav.navigate('Consultation', {
        consultationId,
        patientName: a.customer.name,
        type: a.type,
      });
    } catch (e) {
      Alert.alert('Could not start consultation', getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return { busyId, accept, reject, cancel, openConsultation };
}
