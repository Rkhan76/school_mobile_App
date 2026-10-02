import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../../theme/tokens';
import { CLASS_OPTIONS, SECTION_OPTIONS, STATUS_OPTIONS, type StudentStatus } from '../mockStudents';

export interface StudentFilters {
  className?: string;
  section?: string;
  status?: StudentStatus;
}

interface Props {
  visible: boolean;
  value: StudentFilters;
  onClose: () => void;
  onApply: (f: StudentFilters) => void;
}

interface ChipsProps<T extends string> {
  options: readonly T[];
  selected: string | undefined;
  onSelect: (v: T | undefined) => void;
}

function Chips<T extends string>({ options, selected, onSelect }: ChipsProps<T>) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o === selected;
        return (
          <Pressable
            key={o}
            onPress={() => onSelect(on ? undefined : o)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StudentFilterSheet({ visible, value, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<StudentFilters>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filter students</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          <Text style={styles.label}>Class</Text>
          <Chips options={CLASS_OPTIONS} selected={draft.className} onSelect={(v) => setDraft((d) => ({ ...d, className: v }))} />
          <Text style={styles.label}>Section</Text>
          <Chips options={SECTION_OPTIONS} selected={draft.section} onSelect={(v) => setDraft((d) => ({ ...d, section: v }))} />
          <Text style={styles.label}>Status</Text>
          <Chips options={STATUS_OPTIONS} selected={draft.status} onSelect={(v) => setDraft((d) => ({ ...d, status: v }))} />
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => setDraft({})}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.apply]} onPress={() => onApply(draft)}>
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
    backgroundColor: colors.cardSolid, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10, maxHeight: '80%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  body: { flexGrow: 0, marginTop: 4 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.mintSoft,
    borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
});
