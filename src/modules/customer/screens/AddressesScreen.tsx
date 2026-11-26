import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LocateFixed, PenLine } from 'lucide-react-native';
import { customersApi } from '../../../api/customers';
import { geoApi } from '../../../api/geo';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loader,
  Screen,
  SectionTitle,
} from '../../../components';
import { colors, radius, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import {
  getCurrentPosition,
  requestLocationPermission,
} from '../../../utils/location';
import { useAsync } from '../../../utils/useAsync';
import type { Address, CreateAddressBody } from '../../../types';

const EMPTY: CreateAddressBody = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  isDefault: false,
};

export function AddressesScreen() {
  const list = useAsync(() => customersApi.addresses());
  const [form, setForm] = useState<CreateAddressBody>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof CreateAddressBody>(
    k: K,
    v: CreateAddressBody[K],
  ) => setForm(f => ({ ...f, [k]: v }));

  /** GPS → pin + address text. The fields stay editable afterwards. */
  const useLocation = async () => {
    setShowForm(true);
    setLocating(true);
    try {
      if (!(await requestLocationPermission())) {
        Alert.alert(
          'Location permission denied',
          'You can still type your address manually.',
        );
        return;
      }
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setForm(f => ({ ...f, lat, lng }));
      try {
        const place = await geoApi.reverse(lat, lng);
        setForm(f => ({
          ...f,
          line1: place.line1,
          city: place.city ?? f.city,
        }));
        setErrors({});
      } catch {
        Alert.alert(
          'Location pinned',
          "We couldn't read the street name. Please type the address; the pin is saved for the rider.",
        );
      }
    } catch (e) {
      Alert.alert('Location unavailable', getErrorMessage(e));
    } finally {
      setLocating(false);
    }
  };

  const openManual = () => {
    setForm(EMPTY);
    setErrors({});
    setShowForm(true);
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (!form.label.trim()) {
      e.label = 'Required';
    }
    if (!form.line1.trim()) {
      e.line1 = 'Required';
    }
    if (!form.city.trim()) {
      e.city = 'Required';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      return;
    }
    setSaving(true);
    try {
      await customersApi.addAddress({
        ...form,
        label: form.label.trim(),
        line1: form.line1.trim(),
        line2: form.line2?.trim() || undefined,
        city: form.city.trim(),
      });
      setForm(EMPTY);
      setShowForm(false);
      list.refresh();
    } catch (err) {
      Alert.alert('Could not save address', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = (a: Address) =>
    Alert.alert('Delete address?', a.label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await customersApi.deleteAddress(a.id);
            list.setData(prev => prev?.filter(x => x.id !== a.id));
          } catch (err) {
            Alert.alert('Could not delete', getErrorMessage(err));
          }
        },
      },
    ]);

  return (
    <Screen refreshing={list.refreshing} onRefresh={list.refresh}>
      {list.loading && !list.data ? (
        <Loader />
      ) : list.error && !list.data ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.data?.length ? (
        list.data.map(a => (
          <Card key={a.id} style={styles.row}>
            <View style={styles.flex}>
              <Text style={typography.h3}>
                {a.label}
                {a.isDefault ? ' · Default' : ''}
              </Text>
              <Text style={typography.caption}>
                {[a.line1, a.line2, a.city].filter(Boolean).join(', ')}
              </Text>
            </View>
            <Button
              title="Delete"
              variant="ghost"
              small
              onPress={() => remove(a)}
            />
          </Card>
        ))
      ) : (
        <EmptyState
          title="No addresses yet"
          message="Add an address for deliveries."
        />
      )}

      {showForm ? (
        <>
          <SectionTitle>New address</SectionTitle>
          <Button
            title={
              form.lat != null
                ? 'Update from my current location'
                : 'Use my current location'
            }
            icon={LocateFixed}
            variant="secondary"
            onPress={useLocation}
            loading={locating}
          />
          {form.lat != null && form.lng != null ? (
            <View style={styles.mapBox}>
              <MapView
                style={StyleSheet.absoluteFill}
                region={{
                  latitude: form.lat,
                  longitude: form.lng,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker
                  draggable
                  coordinate={{ latitude: form.lat, longitude: form.lng }}
                  pinColor={colors.primary}
                  onDragEnd={e =>
                    setForm(f => ({
                      ...f,
                      lat: e.nativeEvent.coordinate.latitude,
                      lng: e.nativeEvent.coordinate.longitude,
                    }))
                  }
                />
              </MapView>
            </View>
          ) : null}
          <Text style={[typography.small, styles.hint]}>
            {form.lat != null
              ? 'Hold and drag the pin to your exact door. Check the address below and edit it if needed.'
              : 'Or type your address below. Pinning your location helps the rider find you.'}
          </Text>
          <Input
            label="Label"
            value={form.label}
            onChangeText={v => set('label', v)}
            placeholder="Home, Office…"
            error={errors.label}
          />
          <Input
            label="Address line 1"
            value={form.line1}
            onChangeText={v => set('line1', v)}
            error={errors.line1}
          />
          <Input
            label="Address line 2 (optional)"
            value={form.line2}
            onChangeText={v => set('line2', v)}
          />
          <Input
            label="City"
            value={form.city}
            onChangeText={v => set('city', v)}
            error={errors.city}
          />
          <View style={styles.switchRow}>
            <Text style={typography.body}>Set as default</Text>
            <Switch
              value={!!form.isDefault}
              onValueChange={v => set('isDefault', v)}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowForm(false)}
              style={styles.flex}
            />
            <Button
              title="Save"
              onPress={save}
              loading={saving}
              style={styles.flex}
            />
          </View>
        </>
      ) : (
        <View style={styles.addRow}>
          <Button
            title="Use location"
            icon={LocateFixed}
            onPress={useLocation}
            loading={locating}
            style={styles.flex}
          />
          <Button
            title="Type it"
            icon={PenLine}
            variant="outline"
            onPress={openManual}
            style={styles.flex}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  hint: { marginTop: spacing.sm, marginBottom: spacing.md },
  mapBox: {
    height: 180,
    marginTop: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  addRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});
