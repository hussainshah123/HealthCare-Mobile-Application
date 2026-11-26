import React, { useEffect } from 'react';
import { consultationSocket } from '../../../socket/consultations';
import { CallPlaceholder } from '../../../components/consultation/CallPlaceholder';
import type { CustomerScreenProps } from '../navigation/types';

export function CallScreen({ route, navigation }: CustomerScreenProps<'Call'>) {
  const { consultationId, title, type } = route.params;

  // Leave the call screen if the doctor ends the consultation.
  useEffect(
    () =>
      consultationSocket.onEnded(e => {
        if (e.consultationId === consultationId) {
          navigation.goBack();
        }
      }),
    [consultationId, navigation],
  );

  return (
    <CallPlaceholder
      title={title}
      type={type}
      onEnd={() => navigation.goBack()}
      endLabel="Leave"
    />
  );
}
