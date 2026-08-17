import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { getDossier, type DossierPayload } from '../api/catalog';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';

export default function DossierScreen() {
  const { user, logout } = useAuth();
  const [dossier, setDossier] = useState<DossierPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setDossier(await getDossier());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger le dossier.');
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

  const p = dossier?.profile;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        kicker="Identité"
        title="Mon dossier"
        subtitle="État civil et pièces — même coffre-fort que le web."
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {error ? <Text style={{ color: colors.redText, marginBottom: 12 }}>{error}</Text> : null}
        {loading && !dossier ? <ActivityIndicator color={colors.navy} /> : null}

        <View style={styles.card}>
          <Text style={styles.name}>{p ? `${p.first_name} ${p.last_name}` : `${user?.first_name} ${user?.last_name}`}</Text>
          <Text style={styles.meta}>{p?.email || user?.email}</Text>
          {p?.nin ? <Text style={styles.meta}>NNI {p.nin}</Text> : null}
          {p?.adresse ? <Text style={styles.meta}>{p.adresse}</Text> : null}
        </View>

        <Text style={styles.section}>Pièces du dossier</Text>
        {(dossier?.completeness.checklist || []).map((item) => (
          <View key={item.code} style={styles.check}>
            <View style={[styles.dot, { backgroundColor: item.present ? '#16A34A' : '#DC2626' }]} />
            <Text style={styles.checkLabel}>{item.label}</Text>
            <Text style={{ color: item.present ? colors.greenText : colors.redText, fontWeight: '700', fontSize: 12 }}>
              {item.present ? 'OK' : 'Manquant'}
            </Text>
          </View>
        ))}

        <Text style={styles.section}>Diplômes</Text>
        {(dossier?.diplomas || []).length === 0 ? (
          <Text style={styles.meta}>Aucun diplôme enregistré.</Text>
        ) : (
          dossier?.diplomas.map((d) => (
            <View key={d.id} style={styles.card}>
              <Text style={styles.itemTitle}>{d.niveau}</Text>
              <Text style={styles.meta}>{d.etablissement} · {d.annee}</Text>
            </View>
          ))
        )}

        <Text style={styles.hint}>
          Photo, scans et CV officiel se déposent aussi sur le portail web. Les deux clients partagent le même dossier.
        </Text>

        <Pressable onPress={() => logout()} style={styles.logout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.line },
  name: { fontWeight: '800', fontSize: 18, color: colors.text },
  meta: { color: colors.muted, marginTop: 4 },
  section: { fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 10 },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  checkLabel: { flex: 1, color: colors.text },
  itemTitle: { fontWeight: '700', color: colors.text },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  logout: { marginTop: 24, alignItems: 'center', padding: 12 },
  logoutText: { color: colors.redText, fontWeight: '700' },
});
