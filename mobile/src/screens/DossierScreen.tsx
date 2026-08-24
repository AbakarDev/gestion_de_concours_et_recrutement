import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../auth/AuthContext';
import { getDossier, uploadDocument, uploadPhoto, addDiploma, type DossierPayload } from '../api/catalog';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';

type CheckItem = DossierPayload['completeness']['checklist'][number];

function guessMime(name: string, fallback = 'application/octet-stream') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return fallback;
}

function generatedHint(code: string, fallback?: string) {
  if (code === 'cv_officiel') {
    return 'Produit automatiquement à partir de l’état civil et des diplômes.';
  }
  if (code === 'lettre_candidature') {
    return 'Rédigée au moment du dépôt (onglet Offres), 200 caractères min.';
  }
  return fallback || 'Produit par la plateforme.';
}

export default function DossierScreen() {
  const { user, logout } = useAuth();
  const [dossier, setDossier] = useState<DossierPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [showDipForm, setShowDipForm] = useState(false);
  const [dipType, setDipType] = useState('Licence');
  const [dipSchool, setDipSchool] = useState('');
  const [dipYear, setDipYear] = useState(String(new Date().getFullYear()));
  const [savingDip, setSavingDip] = useState(false);

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

  const checklist = dossier?.completeness.checklist || [];
  const photoItem = checklist.find((i) => i.code === 'photo_identite');
  const uploadItems = checklist.filter((i) => !i.generated && i.code !== 'photo_identite');
  const generatedItems = checklist.filter((i) => i.generated);

  const progress = useMemo(() => {
    const tracked = checklist.filter((i) => i.code !== 'lettre_candidature');
    const done = tracked.filter((i) => i.present).length;
    return { done, total: tracked.length };
  }, [checklist]);

  const piecesReady = progress.total > 0 && progress.done === progress.total;

  const afterUpload = async () => {
    await load();
    Alert.alert('Dossier', 'Pièce enregistrée.');
  };

  const pickPhoto = async (fromCamera: boolean) => {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo', 'Autorisez l’accès à la caméra.');
        return;
      }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo', 'Autorisez l’accès à la galerie.');
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading('photo_identite');
    try {
      await uploadPhoto(asset.uri, asset.mimeType || 'image/jpeg');
      await afterUpload();
    } catch (err: any) {
      Alert.alert('Photo', err.response?.data?.message || 'Téléversement impossible.');
    } finally {
      setUploading(null);
    }
  };

  const pickFile = async (code: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(code);
    try {
      await uploadDocument(
        asset.uri,
        asset.name || `${code}.pdf`,
        asset.mimeType || guessMime(asset.name || ''),
        code,
      );
      await afterUpload();
    } catch (err: any) {
      Alert.alert('Pièce', err.response?.data?.message || 'Téléversement impossible.');
    } finally {
      setUploading(null);
    }
  };

  const onPiecePress = (item: CheckItem) => {
    if (item.generated) {
      Alert.alert(item.label, generatedHint(item.code, item.hint));
      return;
    }
    if (uploading) return;
    if (item.code === 'photo_identite') {
      Alert.alert('Photo d’identité', 'Choisissez une source', [
        { text: 'Galerie', onPress: () => pickPhoto(false) },
        { text: 'Caméra', onPress: () => pickPhoto(true) },
        { text: 'Annuler', style: 'cancel' },
      ]);
      return;
    }
    pickFile(item.code);
  };

  const p = dossier?.profile;
  const fullName = p ? `${p.first_name} ${p.last_name}` : `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        kicker="Coffre-fort"
        title="Mon dossier"
        subtitle="Photo, scans et diplômes — même espace que le portail web."
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

        {loading && !dossier ? <ActivityIndicator color={colors.navy} style={{ marginVertical: 24 }} /> : null}

        {dossier ? (
          <>
            {/* Progression */}
            <View style={[styles.progressCard, piecesReady ? styles.progressOk : styles.progressWarn]}>
              <View style={styles.progressTop}>
                <Text style={[styles.progressTitle, { color: piecesReady ? colors.greenText : colors.amberText }]}>
                  {piecesReady ? 'Dossier prêt pour postuler' : 'Complétez vos pièces'}
                </Text>
                <Text style={styles.progressCount}>
                  {progress.done}/{progress.total}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress.total ? (100 * progress.done) / progress.total : 0}%`,
                      backgroundColor: piecesReady ? '#16A34A' : '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressHint}>
                {piecesReady
                  ? 'La lettre de candidature se rédige au dépôt (Offres).'
                  : 'Touchez une pièce manquante pour la déposer.'}
              </Text>
            </View>

            {/* Identité */}
            <Text style={styles.section}>Identité</Text>
            <View style={styles.card}>
              <View style={styles.identityRow}>
                <View style={styles.avatar}>
                  {p?.has_photo ? (
                    <Ionicons name="person" size={28} color={colors.navy} />
                  ) : (
                    <Ionicons name="person-outline" size={28} color={colors.muted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{fullName || 'Candidat'}</Text>
                  <Text style={styles.meta}>{p?.email || user?.email}</Text>
                  {p?.nin ? <Text style={styles.meta}>NNI · {p.nin}</Text> : null}
                </View>
              </View>
            </View>

            {/* Photo */}
            <Text style={styles.section}>1. Photo d’identité</Text>
            <View style={styles.card}>
              <View style={styles.photoRow}>
                <View style={[styles.photoPreview, photoItem?.present && styles.photoOk]}>
                  {uploading === 'photo_identite' ? (
                    <ActivityIndicator color={colors.navy} />
                  ) : (
                    <Ionicons
                      name={photoItem?.present ? 'checkmark-circle' : 'camera-outline'}
                      size={32}
                      color={photoItem?.present ? colors.greenText : colors.muted}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>
                    {photoItem?.present ? 'Photo déposée' : 'Aucune photo'}
                  </Text>
                  <Text style={styles.meta}>JPG ou PNG · visage bien visible</Text>
                  <View style={styles.photoActions}>
                    <Pressable
                      style={styles.secondaryBtn}
                      disabled={Boolean(uploading)}
                      onPress={() => pickPhoto(false)}
                    >
                      <Ionicons name="images-outline" size={16} color={colors.navy} />
                      <Text style={styles.secondaryBtnText}>Galerie</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      disabled={Boolean(uploading)}
                      onPress={() => pickPhoto(true)}
                    >
                      <Ionicons name="camera-outline" size={16} color={colors.navy} />
                      <Text style={styles.secondaryBtnText}>Caméra</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Scans */}
            <Text style={styles.section}>2. Pièces à déposer</Text>
            {uploadItems.length === 0 ? (
              <Text style={styles.meta}>Aucune pièce à téléverser pour le moment.</Text>
            ) : (
              uploadItems.map((item) => {
                const busy = uploading === item.code;
                return (
                  <Pressable
                    key={item.code}
                    style={styles.pieceCard}
                    onPress={() => onPiecePress(item)}
                    disabled={Boolean(uploading)}
                  >
                    <View style={[styles.pieceIcon, item.present ? styles.pieceIconOk : styles.pieceIconMiss]}>
                      <Ionicons
                        name={item.present ? 'document-attach' : 'cloud-upload-outline'}
                        size={18}
                        color={item.present ? colors.greenText : colors.navy}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkLabel}>{item.label}</Text>
                      <Text style={styles.itemHint}>
                        {item.present ? 'Déposée — touchez pour remplacer' : item.hint || 'PDF, JPG ou PNG'}
                      </Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator color={colors.navy} />
                    ) : (
                      <Text style={[styles.actionLabel, { color: item.present ? colors.greenText : colors.navy }]}>
                        {item.present ? 'OK' : 'Déposer'}
                      </Text>
                    )}
                  </Pressable>
                );
              })
            )}

            {/* Générées */}
            {generatedItems.length > 0 ? (
              <>
                <Text style={styles.section}>3. Pièces générées</Text>
                {generatedItems.map((item) => (
                  <Pressable key={item.code} style={styles.pieceCard} onPress={() => onPiecePress(item)}>
                    <View style={[styles.pieceIcon, styles.pieceIconInfo]}>
                      <Ionicons name="information-circle-outline" size={18} color={colors.blueText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkLabel}>{item.label}</Text>
                      <Text style={styles.itemHint}>{generatedHint(item.code, item.hint)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  </Pressable>
                ))}
              </>
            ) : null}

            {/* Diplômes */}
            <View style={styles.sectionRow}>
              <Text style={styles.section}>4. Diplômes</Text>
              <Pressable onPress={() => setShowDipForm((v) => !v)}>
                <Text style={styles.link}>{showDipForm ? 'Fermer' : '+ Ajouter'}</Text>
              </Pressable>
            </View>
            {(dossier.diplomas || []).length === 0 ? (
              <View style={styles.emptyMini}>
                <Text style={styles.meta}>Aucun diplôme. Ajoutez-en un pour le CV officiel.</Text>
              </View>
            ) : (
              dossier.diplomas.map((d) => (
                <View key={d.id} style={styles.dipCard}>
                  <Ionicons name="school-outline" size={18} color={colors.navy} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{d.niveau}</Text>
                    <Text style={styles.meta}>
                      {d.etablissement} · {d.annee}
                    </Text>
                  </View>
                </View>
              ))
            )}
            {showDipForm ? (
              <View style={styles.card}>
                <Text style={styles.itemTitle}>Nouveau diplôme</Text>
                <TextInput style={styles.input} value={dipType} onChangeText={setDipType} placeholder="Licence, Master, BAC…" />
                <TextInput style={styles.input} value={dipSchool} onChangeText={setDipSchool} placeholder="Établissement" />
                <TextInput
                  style={styles.input}
                  value={dipYear}
                  onChangeText={setDipYear}
                  placeholder="Année"
                  keyboardType="number-pad"
                />
                <Pressable
                  style={styles.primaryBtn}
                  disabled={savingDip}
                  onPress={async () => {
                    if (!dipSchool.trim()) {
                      Alert.alert('Diplôme', 'Indiquez l’établissement.');
                      return;
                    }
                    setSavingDip(true);
                    try {
                      await addDiploma({
                        type_diplome: dipType,
                        etablissement: dipSchool.trim(),
                        annee: Number(dipYear) || new Date().getFullYear(),
                      });
                      setDipSchool('');
                      setShowDipForm(false);
                      await load();
                      Alert.alert('Diplôme', 'Cursus mis à jour.');
                    } catch (err: any) {
                      Alert.alert('Diplôme', err.response?.data?.message || 'Enregistrement impossible.');
                    } finally {
                      setSavingDip(false);
                    }
                  }}
                >
                  <Text style={styles.primaryBtnText}>{savingDip ? 'Enregistrement…' : 'Enregistrer'}</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              onPress={() =>
                Alert.alert('Déconnexion', 'Quitter l’espace candidat ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
                ])
              }
              style={styles.logout}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.redText} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
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
  progressCard: { borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1 },
  progressOk: { backgroundColor: colors.greenBg, borderColor: '#A7F3D0' },
  progressWarn: { backgroundColor: colors.amberBg, borderColor: '#FDE68A' },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontWeight: '800', fontSize: 14 },
  progressCount: { fontWeight: '800', color: colors.text, fontSize: 14 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(15,23,42,0.08)', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressHint: { marginTop: 10, fontSize: 12, color: colors.muted, lineHeight: 17 },
  section: { fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 10, fontSize: 14 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  link: { color: colors.navy, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  identityRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blueBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '800', fontSize: 17, color: colors.text },
  meta: { color: colors.muted, marginTop: 3, fontSize: 13, lineHeight: 18 },
  photoRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  photoPreview: {
    width: 72,
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOk: { borderStyle: 'solid', borderColor: '#86EFAC', backgroundColor: colors.greenBg },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.blueBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryBtnText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  pieceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pieceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceIconOk: { backgroundColor: colors.greenBg },
  pieceIconMiss: { backgroundColor: colors.blueBg },
  pieceIconInfo: { backgroundColor: '#EFF6FF' },
  checkLabel: { color: colors.text, fontWeight: '700', fontSize: 14 },
  itemHint: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 16 },
  itemTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  actionLabel: { fontWeight: '800', fontSize: 12 },
  emptyMini: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  dipCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  logout: {
    marginTop: 28,
    alignItems: 'center',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: colors.redText, fontWeight: '700' },
});
