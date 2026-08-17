import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import FlagBar from './FlagBar';

export default function ScreenHeader({
  kicker,
  title,
  subtitle,
  onBack,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View style={{ height: insets.top, backgroundColor: colors.navyDark }} />
      <FlagBar />
      <View style={{ backgroundColor: colors.navy, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18 }}>
        {onBack ? (
          <Pressable onPress={onBack} style={{ marginBottom: 8 }}>
            <Text style={{ color: '#BFDBFE', fontWeight: '700' }}>‹ Retour</Text>
          </Pressable>
        ) : null}
        <Text style={{ color: '#93C5FD', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' }}>
          {kicker}
        </Text>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 }}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: '#BFDBFE', fontSize: 13, marginTop: 6, lineHeight: 18 }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
