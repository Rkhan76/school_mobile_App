import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import type { AuditFilters } from './types';

type Key = 'entityType' | 'action' | 'userId' | 'from' | 'to';
type Props = { filters: AuditFilters; onClear: (k: Key) => void };

const LABELS: { key: Key; label: string }[] = [
  { key: 'entityType', label: 'Entity' },
  { key: 'action', label: 'Action' },
  { key: 'userId', label: 'User' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
];

export function activeFilterCount(f: AuditFilters): number {
  return LABELS.filter((l) => f[l.key].trim() !== '').length;
}

export function ActiveFilterChips({ filters, onClear }: Props) {
  const active = LABELS.filter((l) => filters[l.key].trim() !== '');
  if (active.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {active.map((a) => (
        <Pressable key={a.key} style={styles.chip} onPress={() => onClear(a.key)} accessibilityLabel={`Clear ${a.label} filter`}>
          <Text style={styles.text}>{a.label}: {filters[a.key]}</Text>
          <Ionicons name="close" size={14} color={colors.primaryDeep} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: { height: 32, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, backgroundColor: colors.mint },
  text: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
});
