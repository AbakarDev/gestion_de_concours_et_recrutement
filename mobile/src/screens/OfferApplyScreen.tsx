import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { applyToOffer } from '../api/applications';
import { getDossier, type DossierPayload, type JobOffer } from '../api/catalog';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';

export default function OfferApplyScreen({ route, navigation }: { route: any; navigation: any }) {
  const offer = route.params?.offer as JobOffer;
  const [dossier, setDossier] = useState<DossierPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [objet, setObjet] = useState(`Candidature — ${offer?.title || ''}`);
  const [corps, setCorps] = useState('');

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

  const checklist = dossier?.completeness.checklist || [];
  const needsLetter = checklist.some((i) => i.code === 'lettre_candidature' && i.required);
  const piecesReady = Boolean(dossier) && checklist
    .filter((i) => i.code !== 'lettre_candidature')
    .every((i) => i.present);
  const letterOk = !needsLetter || corps.trim().length >= 200;
  const ready = Boolean(piecesReady && letterOk);
  const missingCount = checklist.filter(
    (i) => i.code !== 'lettre_candidature' && !i.present,
  ).length;

  const goDossier = () => {
    navigation.getParent()?.navigate('Dossier');
  };

  const apply = async () => {
    setBusy(true);
    try {
      const created = await applyToOffer(
        offer.id,
        needsLetter ? { motivation_objet: objet, motivation_corps: corps } : undefined,
      );
      Alert.alert('Candidature déposée', created.application_number || 'Dossier enregistré.', [
        { text: 'Voir mes dossiers', onPress: () => navigation.getParent()?.navigate('Candidatures') },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message
        || 'Dépôt impossible. Complétez le dossier (photo et pièces).';
      Alert.alert('Dépôt refusé', msg);
    } finally {
      setBusy(false);
    }
  };

  const letterLen = corps.trim().length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        kicker="Postuler"
        title={offer.title}
        subtitle={offer.competition_title || offer.location || undefined}
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {(offer.location || offer.positions_count != null || offer.fee_required) ? (
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
                  <Text style={styles.chipText}>{offer.positions_count} poste(s)</Text>
                </View>
              ) : null}
              {offer.fee_required ? (
                <View style={styles.chip}>
                  <Ionicons name="card-outline" size={13} color={colors.muted} />
                  <Text style={styles.chipText}>Frais d’inscription</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {offer.description ? <Text style={styles.desc}>{offer.description}</Text> : null}

          <View style={[styles.banner, piecesReady ? styles.bannerOk : styles.bannerWarn]}>
            <Ionicons
              name={piecesReady ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={piecesReady ? colors.greenText : colors.amberText}
            />
            <Text style={[styles.bannerText, { color: piecesReady ? colors.greenText : colors.amberText }]}>
              {piecesReady
                ? 'Pièces du dossier en ordre'
                : `${missingCount} pièce(s) manquante(s) — dépôt bloqué`}
            </Text>
          </View>

          <Text style={styles.section}>Checklist</Text>
          {checklist.map((item) => {
            const letterDone = item.code === 'lettre_candidature' && letterLen >= 200;
            const ok = item.present || letterDone;
            return (
              <View key={item.code} style={styles.check}>
                <View style={[styles.checkIcon, ok ? styles.checkOk : styles.checkMiss]}>
                  <Ionicons
                    name={ok ? 'checkmark' : 'close'}
                    size={14}
                    color={ok ? colors.greenText : colors.redText}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkLabel}>
                    {item.label}
                    {item.required ? ' *' : ''}
                  </Text>
                  {item.generated && !ok ? (
                    <Text style={styles.hint}>
                      {item.code === 'lettre_candidature' ? 'À rédiger ci-dessous' : 'Généré par la plateforme'}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          {!piecesReady ? (
            <Pressable style={styles.linkBtn} onPress={goDossier}>
              <Ionicons name="folder-open-outline" size={18} color="#fff" />
              <Text style={styles.linkBtnText}>Compléter mon dossier</Text>
            </Pressable>
          ) : null}

          {needsLetter ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.section}>Lettre de candidature</Text>
              <TextInput
                style={styles.input}
                value={objet}
                onChangeText={setObjet}
                placeholder="Objet"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={[styles.input, styles.textarea]}
                value={corps}
                onChangeText={setCorps}
                placeholder="Corps de la lettre (200 caractères minimum)"
                placeholderTextColor="#94A3B8"
                multiline
              />
              <Text style={[styles.counter, letterOk ? { color: colors.greenText } : null]}>
                {letterLen} / 200
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.btn, (!ready || busy) && { opacity: 0.45 }]}
            onPress={apply}
            disabled={!ready || busy}
          >
            <Text style={styles.btnText}>{busy ? 'Dépôt…' : 'Déposer ma candidature'}</Text>
          </Pressable>
          {!ready ? (
            <Text style={styles.footerHint}>
              {!piecesReady
                ? 'Complétez d’abord photo et scans dans l’onglet Dossier.'
                : 'La lettre doit contenir au moins 200 caractères.'}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: { color: colors.muted, fontSize: 12 },
  desc: { color: colors.muted, lineHeight: 20, marginBottom: 14 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerOk: { backgroundColor: colors.greenBg, borderColor: '#A7F3D0' },
  bannerWarn: { backgroundColor: colors.amberBg, borderColor: '#FDE68A' },
  bannerText: { flex: 1, fontWeight: '700', fontSize: 13 },
  section: { fontWeight: '800', color: colors.text, marginBottom: 10, marginTop: 4 },
  check: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  checkIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOk: { backgroundColor: colors.greenBg },
  checkMiss: { backgroundColor: colors.redBg },
  checkLabel: { color: colors.text, fontWeight: '600', fontSize: 14 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 13,
    marginVertical: 8,
  },
  linkBtnText: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    color: colors.text,
  },
  textarea: { height: 140, textAlignVertical: 'top' },
  counter: { color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: '600' },
  btn: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footerHint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 17 },
});
