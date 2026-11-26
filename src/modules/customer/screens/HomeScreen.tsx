import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { catalogueApi } from '../../../api/catalogue';
import { doctorsApi } from '../../../api/doctors';
import { FileText, Pill } from 'lucide-react-native';
import {
  Button,
  ErrorState,
  GradientCard,
  Input,
  Loader,
  PulseLine,
  Screen,
  SectionTitle,
} from '../../../components';
import { useAuth } from '../../../store/AuthContext';
import { colors, radius, spacing, typography } from '../../../theme';
import { useAsync } from '../../../utils/useAsync';
import { DoctorListItem } from '../components/DoctorListItem';
import { useCustomerNav } from '../hooks/useCustomerNav';

export function HomeScreen() {
  const nav = useCustomerNav();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const home = useAsync(async () => {
    const [categories, doctors] = await Promise.all([
      catalogueApi.categories(),
      doctorsApi.list({ page: 1, limit: 5 }),
    ]);
    return { categories, doctors: doctors.items };
  });

  const submitSearch = () => {
    if (search.trim()) {
      nav.navigate('MedicineList', {
        search: search.trim(),
        title: `“${search.trim()}”`,
      });
    }
  };

  return (
    <Screen refreshing={home.refreshing} onRefresh={home.refresh}>
      <Text style={typography.h2}>
        Hi {user?.name?.split(' ')[0] ?? 'there'}
      </Text>
      <Text style={[typography.caption, styles.mb]}>
        What do you need today?
      </Text>
      <Input
        placeholder="Search medicines, brands…"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        onSubmitEditing={submitSearch}
      />

      <View style={styles.quick}>
        <GradientCard
          style={styles.quickCard}
          from={colors.primaryDark}
          to={colors.primary}
          icon={FileText}
          title="Upload prescription"
          subtitle="We'll attach it to your order"
          decoration={<PulseLine width={72} height={24} opacity={0.6} />}
          onPress={() => nav.navigate('UploadPrescription')}
        />
        <GradientCard
          style={styles.quickCard}
          from={colors.primary}
          to={colors.accent}
          icon={Pill}
          title="Browse medicines"
          subtitle="Compare pharmacy prices"
          onPress={() =>
            nav.navigate('MedicineList', { title: 'All medicines' })
          }
        />
      </View>

      {home.loading ? (
        <Loader />
      ) : home.error ? (
        <ErrorState message={home.error} onRetry={home.reload} />
      ) : (
        <>
          <SectionTitle>Categories</SectionTitle>
          {home.data?.categories.length ? (
            <FlatList
              horizontal
              data={home.data.categories}
              keyExtractor={c => c.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.category}
                  onPress={() =>
                    nav.navigate('MedicineList', {
                      categoryId: item.id,
                      title: item.name,
                    })
                  }
                >
                  <Text style={styles.categoryText} numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          ) : (
            <Text style={typography.caption}>No categories yet.</Text>
          )}

          <View style={styles.sectionRow}>
            <SectionTitle>Consult a doctor</SectionTitle>
            <Button
              title="See all"
              variant="ghost"
              small
              onPress={() => nav.navigate('Tabs', { screen: 'Doctors' })}
            />
          </View>
          {home.data?.doctors.length ? (
            home.data.doctors.map(d => (
              <DoctorListItem
                key={d.id}
                doctor={d}
                onPress={() => nav.navigate('DoctorDetail', { doctorId: d.id })}
              />
            ))
          ) : (
            <Text style={typography.caption}>
              No doctors available right now.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mb: { marginBottom: spacing.md },
  quick: { flexDirection: 'row', gap: spacing.md },
  quickCard: { flex: 1, marginBottom: spacing.md },
  category: {
    width: 110,
    height: 70,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  categoryText: { fontWeight: '600', color: colors.text, textAlign: 'center' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
