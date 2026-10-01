import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';

interface Props {
  academicYear: string;
  hasUnread: boolean;
  onThemePress?: () => void;
  onBellPress?: () => void;
  onProfilePress?: () => void;
}

export function AppBar({ academicYear, hasUnread, onThemePress, onBellPress, onProfilePress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={20} color={colors.white} />
        </View>
        <View>
          <Text style={styles.name}>Verdant</Text>
          <Text style={styles.sub}>Dashboard</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.chip}>
          <Ionicons name="calendar-outline" size={14} color={colors.primaryDeep} />
          <Text style={styles.chipText}>{academicYear}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={onThemePress} accessibilityLabel="Toggle theme">
          <Ionicons name="moon-outline" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onBellPress} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
          {hasUnread ? <View style={styles.dot} /> : null}
        </Pressable>
        <Pressable style={[styles.iconBtn, styles.profile]} onPress={onProfilePress} accessibilityLabel="Profile">
          <Ionicons name="person" size={17} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, lineHeight: 20 },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 10,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardSolid, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  profile: { backgroundColor: colors.primary, borderColor: colors.primary },
  dot: {
    position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.cardSolid,
  },
});
