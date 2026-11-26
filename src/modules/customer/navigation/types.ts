import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type CustomerTabParamList = {
  Home: undefined;
  Doctors: { specializationId?: string } | undefined;
  Orders: undefined;
  Appointments: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  Tabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  MedicineList: { categoryId?: string; title?: string; search?: string };
  MedicineDetail: { medicineId: string };
  Cart: undefined;
  UploadPrescription: undefined;
  Checkout: undefined;
  OrderDetail: { orderId: string };
  LiveTracking: { orderId: string };
  DoctorDetail: { doctorId: string };
  BookAppointment: { doctorId: string; doctorName: string; fee: number };
  Consultation: {
    consultationId: string;
    title: string;
    type: 'AUDIO' | 'VIDEO' | 'CHAT';
  };
  Call: { consultationId: string; title: string; type: 'AUDIO' | 'VIDEO' };
  MyPrescriptions: undefined;
  Addresses: undefined;
  Notifications: undefined;
};

export type CustomerScreenProps<T extends keyof CustomerStackParamList> =
  NativeStackScreenProps<CustomerStackParamList, T>;
