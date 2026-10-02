import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';

export type ViewMode = 'class' | 'teacher';

const TABS: { key: ViewMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'class', label: 'Class view', icon: 'people-outline' },
  { key: 'teacher', label: 'My schedule', icon: 'person-circle-outline' },
];

/** Segmented toggle: Class view | Teacher view. */
export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <View style={styles.wrap}>
      {TABS.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Ionicons name={t.icon} size={16} color={active ? colors.white : colors.textSecondary} />
            <Text style={[styles.text, active && styles.textActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border,
  },
  tab: {
    flex: 1, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: colors.primary },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  textActive: { color: colors.white },
});
