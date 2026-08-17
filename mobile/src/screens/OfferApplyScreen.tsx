import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { applyToOffer } from '../api/applications';
import { getDossier, type DossierPayload, type JobOffer } from '../api/catalog';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';

export default function OfferApplyScreen({ route, navigation }: { route: any; navigation: any }) {
  const offer = route.params?.offer as JobOffer;
  const [dossier, setDossier] = useState<DossierPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setDossier(await getDossier(offer.id));
    } catch (err: any) {
      Alert.alert('Dossier', err.response?.data?.message || 'Impossible de vérifier le dossier.');
    } finally {
      setLoading(false);
    }
  }, [offer.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const ready = Boolean(dossier?.completeness.ready);

  const apply = async () => {
    setBusy(true);
    try {
      const created = await applyToOffer(offer.id);
      Alert.alert('Candidature déposée', created.application_number || 'Dossier enregistré.', [
        { text: 'Voir mes dossiers', onPress: () => navigation.navigate('Candidatures') },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Dépôt impossible. Complétez le dossier si des pièces manquent.';
      Alert.alert('Dépôt refusé', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        kicker="Postuler"
        title={offer.title}
        subtitle={offer.competition_title}
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {offer.description ? <Text style={styles.desc}>{offer.description}</Text> : null}
          <Text style={styles.section}>Pièces exigées</Text>
          {(dossier?.completeness.checklist || []).map((item) => (
            <View key={item.code} style={styles.check}>
              <Text style={{ color: item.present ? colors.greenText : colors.redText, fontWeight: '800' }}>
                {item.present ? '✓' : '!'}
              </Text>
              <Text style={styles.checkLabel}>
                {item.label}
                {item.required ? ' *' : ''}
              </Text>
            </View>
          ))}
          {!ready ? (
            <Text style={styles.warn}>
              Le dépôt est bloqué tant que le dossier n’est pas complet (même règle que sur le web).
            </Text>
          ) : null}
          <Pressable style={[styles.btn, (!ready || busy) && { opacity: 0.5 }]} onPress={apply} disabled={!ready || busy}>
            <Text style={styles.btnText}>{busy ? 'Dépôt…' : 'Déposer ma candidature'}</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  desc: { color: colors.muted, lineHeight: 20, marginBottom: 16 },
  section: { fontWeight: '800', color: colors.text, marginBottom: 10 },
  check: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  checkLabel: { color: colors.text, flex: 1 },
  warn: { color: colors.amberText, marginTop: 8, marginBottom: 8, lineHeight: 20 },
  btn: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
});
