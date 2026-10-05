import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { telUrl } from './TeacherProfileCard';

export function TeacherBottomActions({ phone, onMessage }: { phone: string; onMessage?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Pressable style={[styles.btn, styles.outline]} onPress={onMessage} accessibilityLabel="Message teacher">
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryDeep} />
        <Text style={[styles.label, { color: colors.primaryDeep }]}>Message</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.filled]}
        onPress={() => void Linking.openURL(telUrl(phone))}
        accessibilityLabel="Call teacher"
      >
        <Ionicons name="call" size={18} color={colors.white} />
        <Text style={[styles.label, { color: colors.white }]}>Call</Text>
      </Pressable>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.backgroundGlass,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  btn: {
    flex: 1, height: 50, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  outline: { backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.primary },
  filled: { backgroundColor: colors.primaryDeep },
  label: { fontFamily: fonts.heading, fontSize: 15 },
}));
