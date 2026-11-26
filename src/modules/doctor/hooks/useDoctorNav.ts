import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DoctorStackParamList } from '../navigation/types';

export function useDoctorNav() {
  return useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
}
