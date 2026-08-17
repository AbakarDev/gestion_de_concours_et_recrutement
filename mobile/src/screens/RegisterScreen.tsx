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

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    setError('');
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      await register(form);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join('\n') : err.response?.data?.message || 'Inscription impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ height: insets.top, backgroundColor: colors.navyDark }} />
      <FlagBar />
      <View style={styles.hero}>
        <Text style={styles.kicker}>Portail public</Text>
        <Text style={styles.heroTitle}>Créer un compte candidat</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="Prénom" value={form.first_name} onChangeText={set('first_name')} />
        <TextInput style={styles.input} placeholder="Nom" value={form.last_name} onChangeText={set('last_name')} />
        <TextInput style={styles.input} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set('email')} />
        <TextInput style={styles.input} placeholder="Mot de passe (8 car. + lettre + chiffre)" secureTextEntry value={form.password} onChangeText={set('password')} />
        <TextInput style={styles.input} placeholder="Confirmation" secureTextEntry value={form.password_confirmation} onChangeText={set('password_confirmation')} />
        <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} onPress={onSubmit} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Création…' : 'S’inscrire'}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22 },
  kicker: { color: '#93C5FD', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 },
  body: { padding: 22, paddingBottom: 40 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  btn: { backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.navy, textAlign: 'center', fontWeight: '600' },
  error: { backgroundColor: colors.redBg, color: colors.redText, padding: 12, borderRadius: 10, marginBottom: 12 },
});
