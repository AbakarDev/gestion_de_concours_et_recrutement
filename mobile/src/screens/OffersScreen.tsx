import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listOffers, type JobOffer } from '../api/catalog';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import StatusBadge from '../ui/StatusBadge';

export default function OffersScreen({ navigation }: { navigation: any }) {
  const [rows, setRows] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await listOffers());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader kicker="Recrutement" title="Offres d’emploi" subtitle="Postes et concours publiés." />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {error ? <Text style={{ color: colors.redText }}>{error}</Text> : null}
        {loading && rows.length === 0 ? <ActivityIndicator color={colors.navy} /> : null}
        {rows.map((offer) => (
          <Pressable
            key={offer.id}
            style={styles.card}
            onPress={() => navigation.navigate('OfferApply', { offer })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={styles.title}>{offer.title}</Text>
              <StatusBadge status={offer.status} label={offer.status_label} />
            </View>
            {offer.competition_title ? <Text style={styles.comp}>{offer.competition_title}</Text> : null}
            {offer.location ? <Text style={styles.meta}>{offer.location}</Text> : null}
            <Text style={styles.cta}>Postuler →</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.line },
  title: { flex: 1, fontWeight: '800', fontSize: 16, color: colors.text },
  comp: { color: colors.navy, marginTop: 8, fontSize: 13 },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  cta: { color: colors.navy, fontWeight: '700', marginTop: 12 },
});
