import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import type { ConfidentialityFilter, ExpiryFilter } from './useSchoolDocuments';

export type DocFilters = { confidentiality: ConfidentialityFilter; expiry: ExpiryFilter };

export const DEFAULT_FILTERS: DocFilters = { confidentiality: 'all', expiry: 'any' };

const CONF: { value: ConfidentialityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'CLASSIFIED', label: 'Classified' },
  { value: 'NORMAL', label: 'Standard' },
];
const EXPIRY: { value: ExpiryFilter; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'expired', label: 'Expired' },
  { value: 'soon', label: 'Expiring in 30 days' },
  { value: 'none', label: 'No expiry' },
];

type Props = {
  visible: boolean;
  value: DocFilters;
  onApply: (f: DocFilters) => void;
  onClose: () => void;
};

function Group<T extends string>({
  title, options, value, onChange,
}: { title: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Bottom sheet with confidentiality and expiry filters. */
export function FilterSheet({ visible, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DocFilters>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filters</Text>
        <Group
          title="CONFIDENTIALITY" options={CONF} value={draft.confidentiality}
          onChange={(v) => setDraft((d) => ({ ...d, confidentiality: v }))}
        />
        <Group
          title="EXPIRY" options={EXPIRY} value={draft.expiry}
          onChange={(v) => setDraft((d) => ({ ...d, expiry: v }))}
        />
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => setDraft(DEFAULT_FILTERS)}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.apply]} onPress={() => { onApply(draft); onClose(); }}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, gap: 14,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  group: { gap: 8 },
  groupTitle: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white },
});
