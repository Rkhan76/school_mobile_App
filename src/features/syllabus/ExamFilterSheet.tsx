import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { lookupExamTypes, lookupSubjects } from './api';
import type { ExamTypeLookupItem, SubjectLookupItem } from './types';

export interface ExamExtraFilters {
  examTypeId: string;
  subjectId: string;
  upcomingOnly: boolean;
}

type Props = {
  visible: boolean;
  value: ExamExtraFilters;
  onApply: (v: ExamExtraFilters) => void;
  onClose: () => void;
};

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/** Bottom sheet with exam type, subject and "Upcoming only" filters. */
export function ExamFilterSheet({ visible, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<ExamExtraFilters>(value);
  const [examTypes, setExamTypes] = useState<ExamTypeLookupItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectLookupItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (visible) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible || loaded) return;
    Promise.all([lookupExamTypes(), lookupSubjects()])
      .then(([types, subs]) => {
        setExamTypes(types);
        setSubjects(subs);
        setLoaded(true);
      })
      .catch(() => {
        // leave lists empty — the user can still use "Upcoming only"
      });
  }, [visible, loaded]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filter exams</Text>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>EXAM TYPE</Text>
          <View style={styles.chips}>
            <Chip label="All exam types" active={draft.examTypeId === ''} onPress={() => setDraft({ ...draft, examTypeId: '' })} />
            {examTypes.map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                active={draft.examTypeId === t.id}
                onPress={() => setDraft({ ...draft, examTypeId: t.id })}
              />
            ))}
          </View>

          <Text style={styles.label}>SUBJECT</Text>
          <View style={styles.chips}>
            <Chip label="All subjects" active={draft.subjectId === ''} onPress={() => setDraft({ ...draft, subjectId: '' })} />
            {subjects.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                active={draft.subjectId === s.id}
                onPress={() => setDraft({ ...draft, subjectId: s.id })}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.switchText}>Upcoming only</Text>
            <Switch
              value={draft.upcomingOnly}
              onValueChange={(v) => setDraft({ ...draft, upcomingOnly: v })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.btn, styles.ghost]}
            onPress={() => setDraft({ examTypeId: '', subjectId: '', upcomingOnly: false })}
          >
            <Text style={styles.ghostText}>Reset</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.primary]} onPress={() => onApply(draft)}>
            <Text style={styles.primaryText}>Apply</Text>
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
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '80%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 4 },
  scroll: { flexGrow: 0 },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.mint, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipTextOn: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingVertical: 6 },
  switchText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  footer: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  ghost: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  ghostText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  primary: { backgroundColor: colors.primary },
  primaryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
});
