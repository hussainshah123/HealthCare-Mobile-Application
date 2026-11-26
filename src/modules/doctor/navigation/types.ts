import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type DoctorTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Availability: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type DoctorStackParamList = {
  Tabs: NavigatorScreenParams<DoctorTabParamList> | undefined;
  Consultation: {
    consultationId: string;
    patientName: string;
    type: 'AUDIO' | 'VIDEO' | 'CHAT';
  };
  Call: { consultationId: string; title: string; type: 'AUDIO' | 'VIDEO' };
  WritePrescription: { consultationId: string; patientName: string };
  Notifications: undefined;
};

export type DoctorScreenProps<T extends keyof DoctorStackParamList> =
  NativeStackScreenProps<DoctorStackParamList, T>;
