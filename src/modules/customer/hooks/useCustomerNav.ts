import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../navigation/types';

/** Navigation typed against the customer root stack (works from tab screens too). */
export function useCustomerNav() {
  return useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
}
