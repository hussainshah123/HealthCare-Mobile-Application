import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RiderTabParamList = {
  Dashboard: undefined;
  Available: undefined;
  History: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RiderStackParamList = {
  Tabs: NavigatorScreenParams<RiderTabParamList> | undefined;
  ActiveDelivery: undefined;
  Notifications: undefined;
};

export type RiderScreenProps<T extends keyof RiderStackParamList> =
  NativeStackScreenProps<RiderStackParamList, T>;
