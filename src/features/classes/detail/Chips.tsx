import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import { hScrollFixed } from '../../../components/ui/scrollStyles';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type ClassTabKey = 'students' | 'attendance' | 'subjects' | 'fee' | 'exams' | 'homework';

export const CLASS_TABS: { key: ClassTabKey; label: string; icon: IconName }[] = [
  { key: 'students', label: 'Student List', icon: 'list-outline' },
  { key: 'attendance', label: 'Attendance', icon: 'calendar-outline' },
  { key: 'subjects', label: 'Subjects', icon: 'book-outline' },
  { key: 'fee', label: 'Fee', icon: 'wallet-outline' },
  { key: 'exams', label: 'Exams', icon: 'create-outline' },
  { key: 'homework', label: 'Homework', icon: 'clipboard-outline' },
];

export function TabChips({ active, onChange }: { active: ClassTabKey; onChange: (k: ClassTabKey) => void }) {
  return (
    <ScrollView horizontal style={hScrollFixed} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CLASS_TABS.map((t) => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Ionicons name={t.icon} size={15} color={on ? colors.white : colors.text} />
            <Text style={[styles.text, on && { color: colors.white }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SectionChips({ sections, activeId, onChange }: { sections: { id: string; name: string }[]; activeId: string; onChange: (id: string) => void }) {
  return (
    <ScrollView horizontal style={hScrollFixed} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {sections.map((s) => {
        const on = s.id === activeId;
        return (
          <Pressable key={s.id} onPress={() => onChange(s.id)} style={[styles.sec, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Text style={[styles.secText, on && { color: colors.white }]}>{s.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  sec: { height: 34, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.mint },
  secText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
}));
