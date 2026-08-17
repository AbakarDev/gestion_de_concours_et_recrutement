import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApplication, simulatePayment, type ApplicationRow } from '../api/applications';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import StatusBadge from '../ui/StatusBadge';

export default function ApplicationDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = Number(route.params?.id);
  const [app, setApp] = useState<ApplicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setApp(await getApplication(id));
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Dossier introuvable.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const pay = async () => {
    setBusy(true);
    try {
      await simulatePayment(id);
      await load();
      Alert.alert('Paiement', 'Frais simulés et confirmés (même mock que le web).');
    } catch (err: any) {
      Alert.alert('Paiement', err.response?.data?.message || 'Échec de la simulation.');
    } finally {
      setBusy(false);
    }
  };

  const needsPay = Boolean(app?.payment?.required) && !app?.payment?.confirmed;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        kicker="Dossier"
        title={app?.application_number || 'Candidature'}
        subtitle={app?.job_offer?.title}
        onBack={() => navigation.goBack()}
      />
      {loading || !app ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.card}>
            <StatusBadge status={app.status} label={app.status_label} />
            {app.job_offer?.competition_title ? (
              <Text style={styles.comp}>{app.job_offer.competition_title}</Text>
            ) : null}
            {app.submitted_at ? (
              <Text style={styles.meta}>Soumis le {new Date(app.submitted_at).toLocaleDateString('fr-FR')}</Text>
            ) : null}
            {app.rejection_reason ? <Text style={styles.reject}>{app.rejection_reason}</Text> : null}
          </View>
          {needsPay ? (
            <View style={styles.card}>
              <Text style={styles.payTitle}>Frais d’inscription</Text>
              <Text style={styles.meta}>L’instruction est bloquée tant que le paiement n’est pas confirmé.</Text>
              <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={pay} disabled={busy}>
                <Text style={styles.btnText}>{busy ? 'Traitement…' : 'Simuler le paiement'}</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  comp: { color: colors.navy, marginTop: 12, fontWeight: '600' },
  meta: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  reject: { color: colors.redText, marginTop: 12 },
  payTitle: { fontWeight: '800', color: colors.text, marginBottom: 4 },
  btn: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  btnText: { color: '#fff', fontWeight: '700' },
});
