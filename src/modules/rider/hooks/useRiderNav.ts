import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RiderStackParamList } from '../navigation/types';

export function useRiderNav() {
  return useNavigation<NativeStackNavigationProp<RiderStackParamList>>();
}
