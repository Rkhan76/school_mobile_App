import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';

type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

const tones: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successBg, fg: colors.success },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  warning: { bg: colors.warningBg, fg: colors.warning },
  neutral: { bg: '#eef2f1', fg: colors.textSecondary },
  primary: { bg: colors.mint, fg: colors.primaryDeep },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontFamily: fonts.bodySemi, fontSize: 11 },
});
