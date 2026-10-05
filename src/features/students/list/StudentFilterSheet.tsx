import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import { getClassesMaster } from '../../common/api';
import type { ClassWithSections, SectionLite } from '../../common/types';

export interface StudentFilters {
  classId?: string;
  sectionId?: string;
}

interface Props {
  visible: boolean;
  value: StudentFilters;
  onClose: () => void;
  onApply: (f: StudentFilters) => void;
}

function Chips<T extends { id: string; name: string }>({
  options,
  selectedId,
  onSelect,
}: {
  options: T[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o.id === selectedId;
        return (
          <Pressable
            key={o.id}
            onPress={() => onSelect(on ? undefined : o.id)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StudentFilterSheet({ visible, value, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<StudentFilters>(value);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      getClassesMaster()
        .then(setClasses)
        .catch(() => setClasses([]));
    }
  }, [visible, value]);

  const selectedClass = classes.find((c) => c.id === draft.classId);
  const sections: SectionLite[] = selectedClass?.sections ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filter students</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          <Text style={styles.label}>Class</Text>
          {classes.length === 0 ? (
            <Text style={styles.hint}>Loading classes…</Text>
          ) : (
            <Chips
              options={classes}
              selectedId={draft.classId}
              onSelect={(id) => setDraft((d) => ({ classId: id, sectionId: id === d.classId ? d.sectionId : undefined }))}
            />
          )}
          {sections.length > 0 && (
            <>
              <Text style={styles.label}>Section</Text>
              <Chips
                options={sections}
                selectedId={draft.sectionId}
                onSelect={(id) => setDraft((d) => ({ ...d, sectionId: id }))}
              />
            </>
          )}
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

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10, maxHeight: '80%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  body: { flexGrow: 0, marginTop: 4 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint },
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
}));
