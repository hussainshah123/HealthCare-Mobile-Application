import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ridersApi } from '../../../api/riders';
import {
  AccountStatusBanner,
  Card,
  EmptyState,
  Loader,
  Screen,
  SectionTitle,
} from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, spacing, typography } from '../../../theme';
import { getErrorMessage } from '../../../utils/errors';
import { formatMoney } from '../../../utils/format';
import { useAsync } from '../../../utils/useAsync';
import { ActiveDeliveryCard } from '../components/ActiveDeliveryCard';
import { useActiveDelivery } from '../hooks/ActiveDeliveryContext';
import { useRiderNav } from '../hooks/useRiderNav';

export function DashboardScreen() {
  const nav = useRiderNav();
  const { user } = useAuth();
  const active = useActiveDelivery();
  const data = useAsync(async () => {
    const [profile, earnings] = await Promise.all([
      ridersApi.me(),
      ridersApi.earnings().catch(() => null),
    ]);
    return { profile, earnings };
  });
  const [toggling, setToggling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      data.refresh();
      active.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const online = !!data.data?.profile.online;
  const approved = user?.status === 'ACTIVE';

  const toggleOnline = async (value: boolean) => {
    if (!value && active.delivery) {
      Alert.alert(
        'Active delivery',
        'Finish your current delivery before going offline.',
      );
      return;
    }
    setToggling(true);
    try {
      const profile = await ridersApi.setAvailability(value);
      data.setData(d =>
        d
          ? {
              ...d,
              profile: {
                ...d.profile,
                ...profile,
                online: profile?.online ?? value,
              },
            }
          : d,
      );
    } catch (e) {
      Alert.alert('Could not change status', getErrorMessage(e));
    } finally {
      setToggling(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([data.refresh(), active.refresh()]);
  };

  return (
    <Screen refreshing={data.refreshing} onRefresh={refreshAll}>
      <AccountStatusBanner status={user?.status} />
      <Card style={[styles.onlineCard, online && styles.onlineOn]}>
        <View style={styles.flex}>
          <Text style={typography.h3}>
            {online ? 'You are online' : 'You are offline'}
          </Text>
          <Text style={typography.caption}>
            {approved
              ? online
                ? 'You will see new delivery requests.'
                : 'Go online to receive deliveries.'
              : 'Available after admin approval.'}
          </Text>
        </View>
        <Switch
          value={online}
          onValueChange={toggleOnline}
          disabled={toggling || !approved || data.loading}
          trackColor={{ true: colors.success, false: colors.border }}
        />
      </Card>

      <SectionTitle>Active delivery</SectionTitle>
      {active.loading ? (
        <Loader />
      ) : active.delivery ? (
        <ActiveDeliveryCard
          delivery={active.delivery}
          sharing={active.sharing}
          onOpen={() => nav.navigate('ActiveDelivery')}
        />
      ) : (
        <EmptyState
          title="No active delivery"
          message={
            online
              ? 'Pick up an available order.'
              : 'Go online to start accepting orders.'
          }
          actionLabel={online ? 'See available orders' : undefined}
          onAction={
            online
              ? () => nav.navigate('Tabs', { screen: 'Available' })
              : undefined
          }
        />
      )}
      {active.error ? <Text style={styles.error}>{active.error}</Text> : null}

      {data.data?.earnings ? (
        <>
          <SectionTitle>Earnings</SectionTitle>
          <View style={styles.stats}>
            <Card style={styles.stat}>
              <Text style={styles.statValue}>
                {formatMoney(data.data.earnings.total)}
              </Text>
              <Text style={typography.small}>Total earned</Text>
            </Card>
            <Card style={styles.stat}>
              <Text style={styles.statValue}>
                {data.data.earnings.deliveries}
              </Text>
              <Text style={typography.small}>Deliveries</Text>
            </Card>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  onlineCard: { flexDirection: 'row', alignItems: 'center' },
  onlineOn: { borderColor: colors.success, borderWidth: 1.5 },
  flex: { flex: 1, marginRight: spacing.md },
  error: { color: colors.danger },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
});
