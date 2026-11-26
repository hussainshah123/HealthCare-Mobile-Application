import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ProductArt } from '../../../components/ProductArt';
import { catalogueApi } from '../../../api/catalogue';
import { cartApi } from '../../../api/cart';
import {
  Banner,
  Button,
  Card,
  Chip,
  ErrorState,
  Loader,
  Screen,
  SectionTitle,
} from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import { getErrorMessage, getErrorStatus } from '../../../utils/errors';
import { formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import type { MedicineOffer } from '../../../types';
import type { CustomerScreenProps } from '../navigation/types';

export function MedicineDetailScreen({
  route,
  navigation,
}: CustomerScreenProps<'MedicineDetail'>) {
  const { medicineId } = route.params;
  const {
    data: med,
    loading,
    error,
    reload,
    refresh,
    refreshing,
  } = useAsync(() => catalogueApi.medicine(medicineId), [medicineId]);
  const [selected, setSelected] = useState<MedicineOffer | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  if (loading) {
    return <Loader />;
  }
  if (error || !med) {
    return <ErrorState message={error ?? 'Not found'} onRetry={reload} />;
  }

  const offers = [...(med.offers ?? [])].sort((a, b) => a.price - b.price);
  const offer = selected ?? offers.find(o => o.stock > 0) ?? null;

  const addToCart = async (replaceCart = false) => {
    if (!offer) {
      return;
    }
    setAdding(true);
    try {
      if (replaceCart) {
        await cartApi.clear();
      }
      await cartApi.addItem({
        medicineId: med.id,
        pharmacyId: offer.pharmacyId,
        quantity: qty,
      });
      Alert.alert('Added to cart', `${med.name} x${qty}`, [
        { text: 'Continue shopping', style: 'cancel' },
        { text: 'View cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (e) {
      if (getErrorStatus(e) === 409) {
        // API.md: a cart holds items from one pharmacy only.
        Alert.alert(
          'Different pharmacy',
          'Your cart has items from another pharmacy. Clear the cart and add this item?',
          [
            { text: 'Keep cart', style: 'cancel' },
            {
              text: 'Clear & add',
              style: 'destructive',
              onPress: () => addToCart(true),
            },
          ],
        );
      } else {
        Alert.alert('Could not add to cart', getErrorMessage(e));
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={refresh}
      footer={
        <View style={styles.footer}>
          <View style={styles.qty}>
            <Chip label="−" onPress={() => setQty(q => Math.max(1, q - 1))} />
            <Text style={styles.qtyText}>{qty}</Text>
            <Chip
              label="+"
              onPress={() => setQty(q => Math.min(offer?.stock ?? 1, q + 1))}
            />
          </View>
          <Button
            title={
              offer ? `Add · ${formatMoney(offer.price * qty)}` : 'Out of stock'
            }
            onPress={() => addToCart()}
            disabled={!offer || offer.stock < 1}
            loading={adding}
            style={styles.flex}
          />
        </View>
      }
    >
      <ProductArt
        form={med.form}
        colorKey={med.name}
        imageUrl={med.imageUrl}
        size={200}
        style={styles.art}
      />
      <View style={styles.tagRow}>
        {med.form ? <Text style={styles.tag}>{med.form}</Text> : null}
        {med.packSize ? <Text style={styles.tag}>{med.packSize}</Text> : null}
        {med.requiresPrescription ? (
          <Text style={[styles.tag, styles.rxTag]}>Prescription</Text>
        ) : (
          <Text style={[styles.tag, styles.otcTag]}>
            No prescription needed
          </Text>
        )}
      </View>
      <Text style={typography.h1}>{med.name}</Text>
      <Text style={[typography.caption, styles.byline]}>
        {[med.brand, med.manufacturer].filter(Boolean).join(' · ')}
      </Text>
      {offers.length ? (
        <Text style={styles.bestPrice}>
          {formatMoney(offers[0].price)}
          <Text style={styles.bestHint}>
            {offers.length > 1
              ? `  lowest of ${offers.length} pharmacies`
              : `  at ${offers[0].pharmacyName}`}
          </Text>
        </Text>
      ) : null}
      {med.requiresPrescription ? (
        <View style={styles.mt}>
          <Banner
            tone="warning"
            title="Prescription required"
            message="You'll attach a prescription at checkout."
          />
        </View>
      ) : null}
      {med.description ? (
        <>
          <SectionTitle>About this medicine</SectionTitle>
          <Text style={[typography.body, styles.desc]}>{med.description}</Text>
        </>
      ) : null}
      {med.dosage ? (
        <Card style={styles.dosage}>
          <Text style={styles.dosageLabel}>How to take</Text>
          <Text style={typography.body}>{med.dosage}</Text>
          <Text style={[typography.small, styles.mtXs]}>
            Always follow your doctor's or pharmacist's advice.
          </Text>
        </Card>
      ) : null}

      <SectionTitle>Available at</SectionTitle>
      {offers.length === 0 ? (
        <Text style={typography.caption}>
          No pharmacy currently stocks this medicine.
        </Text>
      ) : (
        offers.map(o => {
          const isSel = offer?.pharmacyId === o.pharmacyId;
          return (
            <Card
              key={o.pharmacyId}
              onPress={
                o.stock > 0
                  ? () => {
                      setSelected(o);
                      setQty(1);
                    }
                  : undefined
              }
              style={[
                styles.offer,
                isSel && styles.offerSel,
                o.stock < 1 && styles.offerOut,
              ]}
            >
              <View style={styles.flex}>
                <Text style={typography.h3}>{o.pharmacyName}</Text>
                <Text style={typography.caption}>
                  {o.stock > 0 ? `${o.stock} in stock` : 'Out of stock'}
                </Text>
              </View>
              <Text style={styles.price}>{formatMoney(o.price)}</Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { marginBottom: spacing.md, borderRadius: radius.lg },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  rxTag: { color: '#fff', backgroundColor: colors.danger },
  otcTag: { color: '#15803D', backgroundColor: '#DCFCE7' },
  byline: { marginTop: 2 },
  bestPrice: {
    marginTop: spacing.md,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  bestHint: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  desc: { lineHeight: 22 },
  dosage: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  dosageLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mtXs: { marginTop: spacing.xs },
  mt: { marginTop: spacing.md },
  flex: { flex: 1 },
  offer: { flexDirection: 'row', alignItems: 'center' },
  offerSel: { borderColor: colors.primary, borderWidth: 2 },
  offerOut: { opacity: 0.5 },
  price: { fontWeight: '700', color: colors.primaryDark, fontSize: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qty: { flexDirection: 'row', alignItems: 'center' },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
    minWidth: 20,
    textAlign: 'center',
  },
});
