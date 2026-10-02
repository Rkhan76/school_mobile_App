import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import { DAYS, MOCK_TODAY, type Day } from './mockTimetable';

type Props = { value: Day; onChange: (d: Day) => void };

/** Horizontally scrollable MON-SAT chips; today's weekday gets a dot. */
export function DaySelector({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {DAYS.map((d) => {
        const active = d === value;
        const today = d === MOCK_TODAY;
        return (
          <Pressable
            key={d}
            onPress={() => onChange(d)}
            style={[styles.chip, today && !active && styles.chipToday, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={today ? `${d}, today` : d}
          >
            <Text style={[styles.text, active && styles.textActive]}>{d}</Text>
            <View style={[styles.dot, today ? (active ? styles.dotOnActive : styles.dotToday) : styles.dotHidden]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8 },
  chip: {
    minWidth: 62, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipToday: { borderColor: colors.primary },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, letterSpacing: 0.5, color: colors.textSecondary },
  textActive: { color: colors.white },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotHidden: { backgroundColor: 'transparent' },
  dotToday: { backgroundColor: colors.primary },
  dotOnActive: { backgroundColor: colors.white },
});
