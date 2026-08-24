import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listMine, type ApplicationRow } from '../api/applications';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import StatusBadge from '../ui/StatusBadge';

type FilterKey = 'all' | 'active' | 'done';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'En cours' },
  { key: 'done', label: 'Terminées' },
];

function isDone(status: string) {
  return ['accepted', 'rejected', 'evaluated'].includes(status);
}

export default function ApplicationsScreen({ navigation }: { navigation: any }) {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await listMine());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les candidatures.');
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
    if (filter === 'active') return rows.filter((a) => !isDone(a.status));
    if (filter === 'done') return rows.filter((a) => isDone(a.status));
    return rows;
  }, [rows, filter]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((a) => !isDone(a.status)).length,
      done: rows.filter((a) => isDone(a.status)).length,
    }),
    [rows],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        kicker="Suivi"
        title="Mes candidatures"
        subtitle="Statut, paiement et convocations de vos dossiers."
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.navy]} />}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.redText} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {rows.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={styles.filters}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setFilter(f.key)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {f.label} ({counts[f.key]})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        {loading && rows.length === 0 ? <ActivityIndicator color={colors.navy} style={{ marginTop: 24 }} /> : null}

        {!loading && rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={36} color={colors.muted} />
            <Text style={styles.emptyTitle}>Aucune candidature</Text>
            <Text style={styles.emptyText}>Parcourez les offres et déposez votre premier dossier.</Text>
            <Pressable style={styles.btn} onPress={() => navigation.getParent()?.navigate('Offres')}>
              <Text style={styles.btnText}>Voir les offres</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && rows.length > 0 && filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Rien dans ce filtre</Text>
            <Text style={styles.emptyText}>Changez de filtre ou actualisez.</Text>
          </View>
        ) : null}

        {filtered.map((app) => {
          const needsPay = Boolean(app.payment?.required) && !app.payment?.confirmed;
          return (
            <Pressable
              key={app.id}
              style={styles.card}
              onPress={() => navigation.navigate('ApplicationDetail', { id: app.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.ref}>{app.application_number || `Dossier #${app.id}`}</Text>
                <StatusBadge status={app.status} label={app.status_label} />
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {app.job_offer?.title || 'Offre'}
              </Text>
              {app.job_offer?.competition_title ? (
                <Text style={styles.comp} numberOfLines={1}>
                  {app.job_offer.competition_title}
                </Text>
              ) : null}
              <View style={styles.footer}>
                <View style={styles.footerLeft}>
                  {app.submitted_at ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="calendar-outline" size={13} color={colors.muted} />
                      <Text style={styles.date}>
                        {new Date(app.submitted_at).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  ) : null}
                  {needsPay ? (
                    <View style={[styles.metaChip, { backgroundColor: colors.amberBg }]}>
                      <Ionicons name="card-outline" size={13} color={colors.amberText} />
                      <Text style={{ color: colors.amberText, fontSize: 11, fontWeight: '700' }}>Paiement</Text>
                    </View>
                  ) : null}
                  {app.convocation_url ? (
                    <View style={[styles.metaChip, { backgroundColor: colors.greenBg }]}>
                      <Ionicons name="ticket-outline" size={13} color={colors.greenText} />
                      <Text style={{ color: colors.greenText, fontSize: 11, fontWeight: '700' }}>Convocation</Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
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
  filters: { flexDirection: 'row', gap: 8 },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#fff' },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: { fontWeight: '800', fontSize: 16, color: colors.text, marginTop: 12 },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 16, lineHeight: 18 },
  btn: { backgroundColor: colors.navy, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 },
  ref: { fontWeight: '800', color: colors.text, fontSize: 13, flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 21 },
  comp: { color: colors.navy, fontSize: 12, marginTop: 4, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footerLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  date: { color: colors.muted, fontSize: 12 },
});
