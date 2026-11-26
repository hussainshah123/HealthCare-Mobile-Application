import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cartApi } from '../../../api/cart';
import { customersApi } from '../../../api/customers';
import { ordersApi } from '../../../api/orders';
import { prescriptionsApi } from '../../../api/prescriptions';
import {
  Banner,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  Row,
  Screen,
  SectionTitle,
  StatusBadge,
} from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { formatDate, formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { PaymentMethod } from '../../../types';
import type { CustomerScreenProps } from '../navigation/types';

export function CheckoutScreen({
  navigation,
}: CustomerScreenProps<'Checkout'>) {
  const data = useAsync(async () => {
    const [cart, addresses, prescriptions] = await Promise.all([
      cartApi.get(),
      customersApi.addresses(),
      prescriptionsApi.mine(),
    ]);
    return { cart, addresses, prescriptions };
  });
  const [addressId, setAddressId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('COD');
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [placing, setPlacing] = useState(false);

  // Re-load when coming back from Addresses / UploadPrescription.
  useFocusEffect(
    useCallback(() => {
      data.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Pre-select the default address and the newest usable prescription.
  useEffect(() => {
    if (!data.data) {
      return;
    }
    const { addresses, prescriptions } = data.data;
    if (!addressId || !addresses.some(a => a.id === addressId)) {
      setAddressId(
        (addresses.find(a => a.isDefault) ?? addresses[0])?.id ?? null,
      );
    }
    if (!prescriptionId) {
      const usable = prescriptions.find(p => p.status !== 'REJECTED');
      setPrescriptionId(usable?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.data]);

  if (data.loading && !data.data) {
    return <Loader />;
  }
  if (data.error && !data.data) {
    return <ErrorState message={data.error} onRetry={data.reload} />;
  }
  const { cart, addresses, prescriptions } = data.data!;
  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        actionLabel="Back to cart"
        onAction={() => navigation.goBack()}
      />
    );
  }
  const needsRx = cart.items.some(i => i.requiresPrescription);
  const usableRx = prescriptions.filter(p => p.status !== 'REJECTED');

  const placeOrder = async () => {
    if (!addressId) {
      Alert.alert('Address required', 'Add a delivery address first.');
      return;
    }
    if (needsRx && !prescriptionId) {
      Alert.alert(
        'Prescription required',
        'Upload or select a prescription for prescription-only items.',
      );
      return;
    }
    setPlacing(true);
    try {
      const order = await ordersApi.create({
        addressId,
        paymentMethod: payment,
        prescriptionId: prescriptionId && needsRx ? prescriptionId : undefined,
        couponCode: coupon.trim() || undefined,
      });
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Tabs', params: { screen: 'Orders' } },
          { name: 'OrderDetail', params: { orderId: order.id } },
        ],
      });
    } catch (e) {
      Alert.alert('Could not place order', getErrorMessage(e));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen
      refreshing={data.refreshing}
      onRefresh={data.refresh}
      footer={
        <Button
          title={`Place order · ${formatMoney(cart.subtotal)}`}
          onPress={placeOrder}
          loading={placing}
          disabled={!addressId || (needsRx && !prescriptionId)}
        />
      }
    >
      <SectionTitle>Delivery address</SectionTitle>
      {addresses.length === 0 ? (
        <Banner
          tone="info"
          title="No saved addresses"
          message="Add an address to continue."
        />
      ) : (
        addresses.map(a => (
          <Card
            key={a.id}
            onPress={() => setAddressId(a.id)}
            style={[styles.option, addressId === a.id && styles.selected]}
          >
            <Text style={typography.h3}>
              {a.label}
              {a.isDefault ? ' · Default' : ''}
            </Text>
            <Text style={typography.caption}>
              {[a.line1, a.line2, a.city].filter(Boolean).join(', ')}
            </Text>
          </Card>
        ))
      )}
      <Button
        title="Manage addresses"
        variant="outline"
        small
        onPress={() => navigation.navigate('Addresses')}
      />

      <SectionTitle>Payment</SectionTitle>
      <View style={styles.row}>
        <Chip
          label="Cash on delivery"
          selected={payment === 'COD'}
          onPress={() => setPayment('COD')}
        />
        <Chip
          label="Pay online"
          selected={payment === 'ONLINE'}
          onPress={() => setPayment('ONLINE')}
        />
      </View>
      {payment === 'ONLINE' ? (
        <Text style={typography.caption}>
          You'll be asked to complete payment once the order is confirmed.
        </Text>
      ) : null}

      {needsRx ? (
        <>
          <SectionTitle>Prescription</SectionTitle>
          {usableRx.length === 0 ? (
            <Banner
              tone="warning"
              title="Prescription required"
              message="Upload a prescription to order these items."
            />
          ) : (
            usableRx.map(p => (
              <Card
                key={p.id}
                onPress={() => setPrescriptionId(p.id)}
                style={[
                  styles.option,
                  styles.rxRow,
                  prescriptionId === p.id && styles.selected,
                ]}
              >
                <View style={styles.flex}>
                  <Text style={typography.h3}>
                    Uploaded {formatDate(p.createdAt)}
                  </Text>
                  {p.notes ? (
                    <Text style={typography.caption} numberOfLines={1}>
                      {p.notes}
                    </Text>
                  ) : null}
                </View>
                <StatusBadge status={p.status} />
              </Card>
            ))
          )}
          <Button
            title="Upload new prescription"
            variant="outline"
            small
            onPress={() => navigation.navigate('UploadPrescription')}
          />
        </>
      ) : null}

      <SectionTitle>Coupon</SectionTitle>
      <Input
        placeholder="Coupon code (optional)"
        value={coupon}
        onChangeText={setCoupon}
        autoCapitalize="characters"
      />

      <SectionTitle>Summary</SectionTitle>
      <Card>
        {cart.items.map(i => (
          <Row
            key={i.id}
            label={`${i.medicineName} x${i.quantity}`}
            value={formatMoney(i.price * i.quantity)}
          />
        ))}
        <View style={styles.divider} />
        <Row label="Subtotal" value={formatMoney(cart.subtotal)} bold />
        <Text style={typography.small}>
          Delivery fee and coupon discount are calculated by the server.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { marginBottom: spacing.sm },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  rxRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});
