import { Text, View } from 'react-native';
import { colors } from '../theme';

const MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  submitted: { label: 'Soumise', bg: colors.skyBg, text: colors.skyText, dot: '#0284C7' },
  under_review: { label: 'En cours', bg: colors.amberBg, text: colors.amberText, dot: '#F59E0B' },
  evaluated: { label: 'Évaluée', bg: colors.blueBg, text: colors.blueText, dot: colors.navy },
  accepted: { label: 'Acceptée', bg: colors.greenBg, text: colors.greenText, dot: '#16A34A' },
  rejected: { label: 'Rejetée', bg: colors.redBg, text: colors.redText, dot: '#DC2626' },
  published: { label: 'Publié', bg: colors.greenBg, text: colors.greenText, dot: '#16A34A' },
  open: { label: 'Ouvert', bg: colors.greenBg, text: colors.greenText, dot: '#16A34A' },
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = MAP[status] || { label: label || status, bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: cfg.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot }} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: cfg.text }}>{label || cfg.label}</Text>
    </View>
  );
}
