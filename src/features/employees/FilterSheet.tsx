import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { CLASSES, SUBJECTS, type Gender } from './mockEmployees';

export interface TeacherFilters { subject?: string; class?: string; gender?: Gender }

type Props = { visible: boolean; value: TeacherFilters; onApply: (f: TeacherFilters) => void; onClose: () => void };

type ChipsProps<T extends string> = {
  title: string;
  options: readonly T[];
  value?: string;
  onChange: (v?: T) => void;
  format?: (v: T) => string;
};

function Chips<T extends string>({ title, options, value, onChange, format }: ChipsProps<T>) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = value === o;
          return (
            <Pressable key={o} onPress={() => onChange(on ? undefined : o)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{format ? format(o) : o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const GENDERS: readonly Gender[] = ['Male', 'Female'];

export function FilterSheet({ visible, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<TeacherFilters>(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filter teachers</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Chips title="Subject" options={SUBJECTS} value={draft.subject} onChange={(subject) => setDraft((d) => ({ ...d, subject }))} />
          <Chips title="Class" options={CLASSES} value={draft.class} onChange={(c) => setDraft((d) => ({ ...d, class: c }))} format={(c) => `Class ${c}`} />
          <Chips title="Gender" options={GENDERS} value={draft.gender} onChange={(gender) => setDraft((d) => ({ ...d, gender }))} />
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => { setDraft({}); onApply({}); onClose(); }}>
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
  sheet: { backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, maxHeight: '80%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  group: { marginTop: 12 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.white },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep, fontSize: 14 },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white, fontSize: 14 },
});
