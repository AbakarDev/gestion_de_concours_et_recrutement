import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listMine, type ApplicationRow } from '../api/applications';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import StatusBadge from '../ui/StatusBadge';

export default function ApplicationsScreen({ navigation }: { navigation: any }) {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader kicker="Suivi" title="Mes candidatures" subtitle="État d’avancement de vos dossiers." />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && rows.length === 0 ? <ActivityIndicator color={colors.navy} /> : null}
        {!loading && rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune candidature soumise</Text>
            <Text style={styles.emptyText}>Découvrez les offres et postulez depuis le mobile.</Text>
            <Pressable style={styles.btn} onPress={() => navigation.navigate('Offres')}>
              <Text style={styles.btnText}>Voir les offres</Text>
            </Pressable>
          </View>
        ) : null}
        {rows.map((app) => (
          <Pressable
            key={app.id}
            style={styles.card}
            onPress={() => navigation.navigate('ApplicationDetail', { id: app.id })}
          >
            <Text style={styles.ref}>Dossier #{app.application_number || app.id}</Text>
            <Text style={styles.title}>{app.job_offer?.title || 'Offre'}</Text>
            {app.job_offer?.competition_title ? (
              <Text style={styles.comp}>{app.job_offer.competition_title}</Text>
            ) : null}
            {app.submitted_at ? (
              <Text style={styles.date}>Soumis le {new Date(app.submitted_at).toLocaleDateString('fr-FR')}</Text>
            ) : null}
            <View style={{ marginTop: 10 }}>
              <StatusBadge status={app.status} label={app.status_label} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.redText, marginBottom: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  emptyTitle: { fontWeight: '800', fontSize: 16, color: colors.text },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 16 },
  btn: { backgroundColor: colors.navy, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.line },
  ref: { fontWeight: '800', color: colors.text, marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  comp: { color: colors.navy, fontSize: 12, marginTop: 4 },
  date: { color: colors.muted, fontSize: 12, marginTop: 8 },
});
