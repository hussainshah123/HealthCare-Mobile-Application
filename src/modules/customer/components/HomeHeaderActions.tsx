import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import {
  HeaderIconButton,
  NotificationsHeaderButton,
} from '../../../components/HeaderButtons';
import { useCartCount } from '../hooks/useCartCount';
import { useCustomerNav } from '../hooks/useCustomerNav';

/** Header actions for the customer Home tab: alerts + cart with item count. */
export function HomeHeaderActions() {
  const nav = useCustomerNav();
  const cartCount = useCartCount();
  return (
    <View style={styles.row}>
      <NotificationsHeaderButton />
      <HeaderIconButton
        icon={ShoppingCart}
        label="Cart"
        badge={cartCount}
        onPress={() => nav.navigate('Cart')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
});
