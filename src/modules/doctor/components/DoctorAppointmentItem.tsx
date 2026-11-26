import React from 'react';
import { AppointmentCard, Button } from '../../../components';
import { formatMoney } from '../../../utils/format';
import type { Appointment } from '../../../types';
import type { useAppointmentActions } from '../hooks/useAppointmentActions';

interface Props {
  appointment: Appointment;
  actions: ReturnType<typeof useAppointmentActions>;
}

export function DoctorAppointmentItem({ appointment: a, actions }: Props) {
  const busy = actions.busyId === a.id;
  return (
    <AppointmentCard
      appointment={a}
      counterpart={a.customer.name}
      subtitle={`Fee ${formatMoney(a.fee)}`}
    >
      {a.status === 'REQUESTED' ? (
        <>
          <Button
            title="Accept"
            small
            loading={busy}
            onPress={() => actions.accept(a)}
          />
          <Button
            title="Reject"
            small
            variant="outline"
            disabled={busy}
            onPress={() => actions.reject(a)}
          />
        </>
      ) : null}
      {a.status === 'CONFIRMED' ? (
        <>
          <Button
            title="Start consultation"
            small
            loading={busy}
            onPress={() => actions.openConsultation(a)}
          />
          <Button
            title="Cancel"
            small
            variant="ghost"
            disabled={busy}
            onPress={() => actions.cancel(a)}
          />
        </>
      ) : null}
      {a.status === 'IN_PROGRESS' ? (
        <Button
          title="Open consultation"
          small
          loading={busy}
          onPress={() => actions.openConsultation(a)}
        />
      ) : null}
    </AppointmentCard>
  );
}
