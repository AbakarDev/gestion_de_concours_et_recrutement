import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { listMine, type ApplicationRow } from '../api/applications';
import { countCompetitions, listOffers } from '../api/catalog';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import StatusBadge from '../ui/StatusBadge';

export default function DashboardScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [offers, setOffers] = useState(0);
  const [competitions, setCompetitions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [rows, offerRows, compCount] = await Promise.all([listMine(), listOffers(), countCompetitions()]);
      setApps(rows);
      setOffers(offerRows.length);
      setCompetitions(compCount);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger le tableau de bord.');
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
      <ScreenHeader
        kicker="Espace candidat"
        title={`Bienvenue, ${user?.first_name ?? ''}`}
        subtitle="Suivez vos dossiers et consultez les concours publiés."
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.stats}>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('Candidatures')}>
            <Text style={styles.statLabel}>Mes candidatures</Text>
            <Text style={styles.statValue}>{loading ? '—' : apps.length}</Text>
          </Pressable>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('Offres')}>
            <Text style={styles.statLabel}>Concours</Text>
            <Text style={styles.statValue}>{loading ? '—' : competitions}</Text>
          </Pressable>
          <Pressable style={styles.stat} onPress={() => navigation.navigate('Offres')}>
            <Text style={styles.statLabel}>Postes</Text>
            <Text style={styles.statValue}>{loading ? '—' : offers}</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Candidatures récentes</Text>
        {loading && apps.length === 0 ? <ActivityIndicator color={colors.navy} style={{ marginVertical: 16 }} /> : null}
        {!loading && apps.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>Aucune candidature pour le moment.</Text>
            <Pressable onPress={() => navigation.navigate('Offres')}>
              <Text style={styles.link}>Postuler à une offre →</Text>
            </Pressable>
          </View>
        ) : null}
        {apps.slice(0, 4).map((app) => (
          <Pressable
            key={app.id}
            style={styles.row}
            onPress={() => navigation.navigate('Candidatures', { screen: 'ApplicationDetail', params: { id: app.id } })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{app.application_number || `Dossier #${app.id}`}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{app.job_offer?.title || 'Offre'}</Text>
            </View>
            <StatusBadge status={app.status} label={app.status_label} />
          </Pressable>
        ))}

        <Text style={[styles.section, { marginTop: 20 }]}>Actions rapides</Text>
        {[
          { tab: 'Offres', title: 'Parcourir les offres', desc: 'Postes et concours publiés' },
          { tab: 'Dossier', title: 'Constituer mon dossier', desc: 'État civil, pièces et CV' },
          { tab: 'Candidatures', title: 'Suivre mes dossiers', desc: 'Statuts et paiement des frais' },
        ].map((item) => (
          <Pressable key={item.title} style={styles.action} onPress={() => navigation.navigate(item.tab)}>
            <View>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line },
  statLabel: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  section: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.line },
  empty: { color: colors.muted, marginBottom: 8 },
  link: { color: colors.navy, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowTitle: { fontWeight: '700', color: colors.text },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionTitle: { fontWeight: '700', color: colors.text },
  actionDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 28, color: '#CBD5E1', lineHeight: 28 },
  error: { color: colors.redText, marginBottom: 12 },
});
