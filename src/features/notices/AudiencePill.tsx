import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import type { Audience } from './types';

export const audienceTone: Record<Audience, { bg: string; fg: string }> = {
  ALL: { bg: colors.mint, fg: colors.primaryDeep },
  TEACHERS: { bg: '#f3e8ff', fg: '#7e22ce' },
  STUDENTS: { bg: '#dbeafe', fg: '#1d4ed8' },
  PARENTS: { bg: '#ffedd5', fg: '#c2410c' },
  STAFF: { bg: '#fef3c7', fg: '#b45309' },
};

export function AudiencePill({ audience }: { audience: Audience }) {
  const t = audienceTone[audience];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{audience}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  text: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.4 },
});
