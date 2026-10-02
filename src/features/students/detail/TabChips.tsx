import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../../theme/tokens';
import type { IconName } from './ui';

export type TabKey = 'overview' | 'guardians' | 'attendance' | 'fees' | 'bank' | 'hostel' | 'documents' | 'reports' | 'history';

export const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'overview', label: 'Overview', icon: 'information-circle-outline' },
  { key: 'guardians', label: 'Guardians', icon: 'people-outline' },
  { key: 'attendance', label: 'Attendance', icon: 'calendar-outline' },
  { key: 'fees', label: 'Fees', icon: 'wallet-outline' },
  { key: 'bank', label: 'Bank', icon: 'business-outline' },
  { key: 'hostel', label: 'Hostel', icon: 'bed-outline' },
  { key: 'documents', label: 'Documents', icon: 'document-text-outline' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-outline' },
  { key: 'history', label: 'History', icon: 'time-outline' },
];

export function TabChips({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {TABS.map((t) => {
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

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
});
