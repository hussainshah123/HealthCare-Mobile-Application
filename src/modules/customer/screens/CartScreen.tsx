import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cartApi } from '../../../api/cart';
import {
  Banner,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Loader,
  Row,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { CartItem } from '../../../types';
import type { CustomerScreenProps } from '../navigation/types';

export function CartScreen({ navigation }: CustomerScreenProps<'Cart'>) {
  const cart = useAsync(() => cartApi.get());
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      cart.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const mutate = async (item: CartItem, action: () => Promise<unknown>) => {
    setBusyId(item.id);
    try {
      await action();
      cart.setData(await cartApi.get());
    } catch (e) {
      Alert.alert('Cart', getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const clear = () =>
    Alert.alert('Clear cart?', 'Remove all items from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await cartApi.clear();
            cart.setData({ items: [], subtotal: 0 });
          } catch (e) {
            Alert.alert('Cart', getErrorMessage(e));
          }
        },
      },
    ]);

  if (cart.loading && !cart.data) {
    return <Loader />;
  }
  if (cart.error && !cart.data) {
    return <ErrorState message={cart.error} onRetry={cart.reload} />;
  }
  const items = cart.data?.items ?? [];
  const needsRx = items.some(i => i.requiresPrescription);

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        refreshing={cart.refreshing}
        onRefresh={cart.refresh}
        ListHeaderComponent={
          needsRx ? (
            <Banner
              tone="warning"
              title="Prescription needed"
              message="Some items need a prescription. You'll attach one at checkout."
            />
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            title="Your cart is empty"
            message="Browse medicines and add them to your cart."
            actionLabel="Browse medicines"
            onAction={() =>
              navigation.navigate('MedicineList', { title: 'All medicines' })
            }
          />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.itemHeader}>
              <Text style={[typography.h3, styles.flex]}>
                {item.medicineName}
              </Text>
              {item.requiresPrescription ? (
                <Text style={styles.rx}>Rx</Text>
              ) : null}
            </View>
            <Text style={typography.caption}>
              {formatMoney(item.price)} each
            </Text>
            <View style={styles.itemFooter}>
              <View style={styles.qty}>
                <Chip
                  label="−"
                  disabled={busyId === item.id}
                  onPress={() =>
                    item.quantity > 1
                      ? mutate(item, () =>
                          cartApi.updateItem(item.id, item.quantity - 1),
                        )
                      : mutate(item, () => cartApi.removeItem(item.id))
                  }
                />
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Chip
                  label="+"
                  disabled={busyId === item.id}
                  onPress={() =>
                    mutate(item, () =>
                      cartApi.updateItem(item.id, item.quantity + 1),
                    )
                  }
                />
              </View>
              <Text style={styles.lineTotal}>
                {formatMoney(item.price * item.quantity)}
              </Text>
            </View>
            <Button
              title="Remove"
              variant="ghost"
              small
              onPress={() => mutate(item, () => cartApi.removeItem(item.id))}
              style={styles.remove}
            />
          </Card>
        )}
      />
      {items.length > 0 ? (
        <View style={styles.footer}>
          <Row label="Subtotal" value={formatMoney(cart.data?.subtotal)} bold />
          <Text style={typography.small}>
            Delivery fee and discounts are applied at checkout.
          </Text>
          <View style={styles.actions}>
            <Button
              title="Clear"
              variant="outline"
              onPress={clear}
              style={styles.clearBtn}
            />
            <Button
              title="Checkout"
              onPress={() => navigation.navigate('Checkout')}
              style={styles.flex}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  flex: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  rx: { color: colors.danger, fontWeight: '700' },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  qty: { flexDirection: 'row', alignItems: 'center' },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
    minWidth: 20,
    textAlign: 'center',
  },
  lineTotal: { fontWeight: '700', color: colors.text },
  remove: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  clearBtn: { width: 100 },
});
