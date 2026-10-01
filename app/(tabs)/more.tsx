import { Text, View } from 'react-native';
import { ScreenBackground } from '../../src/components/ui/Screen';
import { fonts, colors } from '../../src/theme/tokens';

export default function MoreScreen() {
  return (
    <ScreenBackground>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.textSecondary }}>More (coming soon)</Text>
      </View>
    </ScreenBackground>
  );
}
