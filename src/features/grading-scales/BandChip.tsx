import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import type { GradeBand } from './mockGrading';

export function BandChip({ band }: { band: GradeBand }) {
  const fg = band.isPass ? colors.success : colors.danger;
  return (
    <View style={[styles.chip, { backgroundColor: band.isPass ? colors.successBg : colors.dangerBg }]}>
      <Text style={[styles.label, { color: fg }]}>{band.label}</Text>
      <Text style={[styles.range, { color: fg }]}>{band.minPercent}-{band.maxPercent}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  label: { fontFamily: fonts.bodySemi, fontSize: 12 },
  range: { fontFamily: fonts.body, fontSize: 11 },
});
