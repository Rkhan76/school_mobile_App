import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, themed } from '../../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

interface Action {
  id: string;
  label: string;
  icon: IconName;
  highlighted?: boolean;
}

const actions: Action[] = [
  { id: 'attendance', label: 'Attendance', icon: 'checkmark-done' },
  { id: 'admission', label: 'Admission', icon: 'person-add', highlighted: true },
  { id: 'fee', label: 'Collect Fee', icon: 'card' },
  { id: 'notice', label: 'Add Notice', icon: 'megaphone' },
];

export function QuickActions({ onPress }: { onPress?: (id: string) => void }) {
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <Pressable
          key={a.id}
          style={[styles.tile, a.highlighted && styles.tileHi]}
          onPress={() => onPress?.(a.id)}
        >
          <View style={[styles.icon, a.highlighted && styles.iconHi]}>
            <Ionicons name={a.icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.label} numberOfLines={1}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  tileHi: { backgroundColor: colors.mint, borderColor: colors.primary },
  icon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  iconHi: { backgroundColor: colors.cardSolid },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.text },
}));
