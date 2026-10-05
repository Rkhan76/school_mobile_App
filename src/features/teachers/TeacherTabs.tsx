import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';

export const TEACHER_TABS = [
  'Overview',
  'Subjects & Classes',
  'Timetable',
  'Attendance',
  'Payroll',
  'Documents',
  'Reports',
] as const;

export type TeacherTab = (typeof TEACHER_TABS)[number];

export function TeacherTabs({ active, onChange }: { active: TeacherTab; onChange: (t: TeacherTab) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {TEACHER_TABS.map((tab) => {
        const on = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.text, on && styles.textOn]}>{tab}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, gap: 8 },
  chip: {
    height: 38, paddingHorizontal: 16, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  textOn: { color: colors.white },
}));
