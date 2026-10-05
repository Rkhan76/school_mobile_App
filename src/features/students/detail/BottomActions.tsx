import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, themed } from '../../../theme/tokens';
import type { StudentDetail } from './studentDetail';

/** Sticky bottom bar: Message Parent / Issue Report. */
export function BottomActions({ s }: { s: StudentDetail }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      <Pressable
        style={[styles.btn, styles.outline]}
        onPress={() => Linking.openURL(`sms:${s.guardian.phone}`).catch(() => Alert.alert('Unable to open messages'))}
      >
        <Ionicons name="chatbubbles-outline" size={18} color={colors.primaryDeep} />
        <Text style={[styles.text, { color: colors.primaryDeep }]}>Message Parent</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.filled]} onPress={() => Alert.alert('Issue Report', `Report for ${s.fullName} coming soon.`)}>
        <Ionicons name="clipboard-outline" size={18} color={colors.white} />
        <Text style={[styles.text, { color: colors.white }]}>Issue Report</Text>
      </Pressable>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.backgroundGlass, borderTopWidth: 1, borderTopColor: colors.border, ...shadow.card },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outline: { backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.primary },
  filled: { backgroundColor: colors.primaryDeep },
  text: { fontFamily: fonts.bodySemi, fontSize: 14 },
}));
