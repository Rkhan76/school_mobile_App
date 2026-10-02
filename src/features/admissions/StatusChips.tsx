import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import type { AdmissionStats, AdmissionStatus } from './mockAdmissions';

export type StatusFilter = AdmissionStatus | 'all';

const CHIPS: { key: StatusFilter; label: string; count: (s: AdmissionStats) => number }[] = [
  { key: 'all', label: 'All', count: (s) => s.total },
  { key: 'pending', label: 'Pending', count: (s) => s.pending },
  { key: 'enrolled', label: 'Enrolled', count: (s) => s.enrolled },
  { key: 'rejected', label: 'Rejected', count: (s) => s.rejected },
  { key: 'cancelled', label: 'Cancelled', count: (s) => s.cancelled },
];

export function StatusChips({ value, onChange, stats }: { value: StatusFilter; onChange: (v: StatusFilter) => void; stats: AdmissionStats }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CHIPS.map((c) => {
        const active = c.key === value;
        return (
          <Pressable key={c.key} onPress={() => onChange(c.key)} style={[styles.chip, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{c.label} ({c.count(stats)})</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16 },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  activeText: { color: colors.white },
});
