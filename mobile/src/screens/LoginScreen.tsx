import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';
import FlagBar from '../ui/FlagBar';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('candidat@test.td');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      if (!err.response) {
        setError(
          'Impossible de joindre l’API. Vérifiez que le PC lance : php artisan serve --host=0.0.0.0 --port=8001 (même Wi‑Fi).',
        );
      } else {
        setError(err.response?.data?.message || 'Identifiants incorrects ou compte inactif.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ height: insets.top, backgroundColor: colors.navyDark }} />
      <FlagBar />
      <View style={styles.hero}>
        <Text style={styles.kicker}>Portail public — concours et recrutements</Text>
        <Text style={styles.heroTitle}>e-CR Tchad</Text>
        <Text style={styles.heroSub}>Espace candidat — concours et recrutements.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.formTitle}>Connexion</Text>
        <Text style={styles.formSub}>Accédez à vos dossiers et aux concours publiés.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="vous@recrute.td"
        />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput secureTextEntry style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" />

        <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={onSubmit} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Connexion…' : 'Se connecter'}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 18 }}>
          <Text style={styles.link}>Pas encore de compte ? Créer un compte candidat</Text>
        </Pressable>
        <Text style={styles.footer}>© 2026 Portail Concours et Recrutements Tchad — PFE</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26 },
  kicker: { color: '#93C5FD', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 8 },
  heroSub: { color: '#BFDBFE', marginTop: 8, lineHeight: 20 },
  body: { padding: 22, paddingBottom: 40 },
  formTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  formSub: { color: colors.muted, marginTop: 6, marginBottom: 20 },
  label: { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  btn: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.navy, textAlign: 'center', fontWeight: '600' },
  error: { backgroundColor: colors.redBg, color: colors.redText, padding: 12, borderRadius: 10, marginBottom: 12 },
  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 28 },
});
