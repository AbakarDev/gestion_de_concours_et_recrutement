import { View } from 'react-native';
import { colors } from '../theme';

export default function FlagBar() {
  return (
    <View style={{ height: 4, flexDirection: 'row' }}>
      <View style={{ flex: 1, backgroundColor: colors.navy }} />
      <View style={{ flex: 1, backgroundColor: colors.gold }} />
      <View style={{ flex: 1, backgroundColor: colors.red }} />
    </View>
  );
}
