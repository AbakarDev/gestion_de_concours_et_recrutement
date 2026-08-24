import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listOffers, type JobOffer } from '../api/catalog';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import StatusBadge from '../ui/StatusBadge';

export default function OffersScreen({ navigation }: { navigation: any }) {
  const [rows, setRows] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        (o.competition_title || '').toLowerCase().includes(q) ||
        (o.location || '').toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        kicker="Recrutement"
        title="Offres"
        subtitle="Concours et postes publiés — touchez pour postuler."
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.navy]} />}
      >
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un poste, concours, lieu…"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {!loading && rows.length > 0 ? (
          <Text style={styles.count}>
            {filtered.length} offre{filtered.length > 1 ? 's' : ''}
            {query ? ` pour « ${query.trim()} »` : ''}
          </Text>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.redText} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && rows.length === 0 ? <ActivityIndicator color={colors.navy} style={{ marginTop: 24 }} /> : null}

        {!loading && rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={36} color={colors.muted} />
            <Text style={styles.emptyTitle}>Aucune offre publiée</Text>
            <Text style={styles.emptyText}>Revenez plus tard ou tirez pour actualiser.</Text>
          </View>
        ) : null}

        {!loading && rows.length > 0 && filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={colors.muted} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyText}>Essayez un autre mot-clé.</Text>
          </View>
        ) : null}

        {filtered.map((offer) => (
          <Pressable
            key={offer.id}
            style={styles.card}
            onPress={() => navigation.navigate('OfferApply', { offer })}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Ionicons name="briefcase" size={18} color={colors.navy} />
              </View>
              <StatusBadge status={offer.status} label={offer.status_label || 'Publié'} />
            </View>
            <Text style={styles.title}>{offer.title}</Text>
            {offer.competition_title ? (
              <Text style={styles.comp} numberOfLines={2}>
                {offer.competition_title}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              {offer.location ? (
                <View style={styles.chip}>
                  <Ionicons name="location-outline" size={13} color={colors.muted} />
                  <Text style={styles.chipText}>{offer.location}</Text>
                </View>
              ) : null}
              {offer.positions_count != null ? (
                <View style={styles.chip}>
                  <Ionicons name="people-outline" size={13} color={colors.muted} />
                  <Text style={styles.chipText}>
                    {offer.positions_count} poste{offer.positions_count > 1 ? 's' : ''}
                  </Text>
                </View>
              ) : null}
              {offer.fee_required ? (
                <View style={styles.chip}>
                  <Ionicons name="card-outline" size={13} color={colors.muted} />
                  <Text style={styles.chipText}>Frais</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.ctaRow}>
              <Text style={styles.cta}>Postuler</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.navy} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },
  count: { color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 12 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.redBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, color: colors.redText, fontSize: 13 },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 8,
  },
  emptyTitle: { fontWeight: '800', fontSize: 16, color: colors.text, marginTop: 12 },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.blueBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800', fontSize: 16, color: colors.text, lineHeight: 22 },
  comp: { color: colors.navy, marginTop: 6, fontSize: 13, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipText: { color: colors.muted, fontSize: 12 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cta: { color: colors.navy, fontWeight: '800', fontSize: 13 },
});
