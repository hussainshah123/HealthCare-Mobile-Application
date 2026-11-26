import React from 'react';
import { CallPlaceholder } from '../../../components/consultation/CallPlaceholder';
import type { DoctorScreenProps } from '../navigation/types';

/** Leaving the call returns to the chat, where the doctor can end the consultation. */
export function CallScreen({ route, navigation }: DoctorScreenProps<'Call'>) {
  const { title, type } = route.params;
  return (
    <CallPlaceholder
      title={title}
      type={type}
      onEnd={() => navigation.goBack()}
      endLabel="Hang up"
    />
  );
}
