import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
        kicker="Candidature"
        title={app?.application_number || 'Dossier'}
        subtitle={app?.job_offer?.title}
        onBack={() => navigation.goBack()}
      />
      {loading || !app ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Statut</Text>
              <StatusBadge status={app.status} label={app.status_label} />
            </View>
            {app.job_offer?.competition_title ? (
              <View style={styles.row}>
                <Ionicons name="ribbon-outline" size={16} color={colors.navy} />
                <Text style={styles.comp}>{app.job_offer.competition_title}</Text>
              </View>
            ) : null}
            {app.submitted_at ? (
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={16} color={colors.muted} />
                <Text style={styles.meta}>
                  Soumis le {new Date(app.submitted_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            ) : null}
            {app.rejection_reason ? (
              <View style={styles.rejectBox}>
                <Text style={styles.rejectTitle}>Motif</Text>
                <Text style={styles.reject}>{app.rejection_reason}</Text>
              </View>
            ) : null}
          </View>

          {needsPay ? (
            <View style={[styles.card, styles.payCard]}>
              <View style={styles.row}>
                <Ionicons name="card-outline" size={20} color={colors.amberText} />
                <Text style={styles.payTitle}>Frais d’inscription</Text>
              </View>
              <Text style={styles.meta}>
                L’instruction est bloquée tant que le paiement n’est pas confirmé.
              </Text>
              <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={pay} disabled={busy}>
                <Text style={styles.btnText}>{busy ? 'Traitement…' : 'Simuler le paiement'}</Text>
              </Pressable>
            </View>
          ) : app.payment?.required && app.payment?.confirmed ? (
            <View style={styles.card}>
              <View style={styles.row}>
                <Ionicons name="checkmark-circle" size={18} color={colors.greenText} />
                <Text style={{ color: colors.greenText, fontWeight: '700' }}>Paiement confirmé</Text>
              </View>
            </View>
          ) : null}

          {app.convocation_url ? (
            <View style={styles.card}>
              <View style={styles.row}>
                <Ionicons name="ticket-outline" size={18} color={colors.navy} />
                <Text style={styles.payTitle}>Convocation disponible</Text>
              </View>
              <Text style={styles.meta}>
                Votre convocation PDF est prête. Téléchargez-la aussi depuis le portail web, ou vérifiez-la
                via /verify-convocation.
              </Text>
            </View>
          ) : null}

          <Pressable style={styles.secondary} onPress={() => navigation.getParent()?.navigate('Offres')}>
            <Text style={styles.secondaryText}>Voir d’autres offres</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.navy} />
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  payCard: { backgroundColor: colors.amberBg, borderColor: '#FDE68A' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontWeight: '700', color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  comp: { color: colors.navy, fontWeight: '600', flex: 1, lineHeight: 20 },
  meta: { color: colors.muted, lineHeight: 20, flex: 1 },
  rejectBox: { marginTop: 14, backgroundColor: colors.redBg, borderRadius: 10, padding: 12 },
  rejectTitle: { fontWeight: '800', color: colors.redText, marginBottom: 4 },
  reject: { color: colors.redText, lineHeight: 18 },
  payTitle: { fontWeight: '800', color: colors.text, flex: 1 },
  btn: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  secondaryText: { color: colors.navy, fontWeight: '700' },
});
