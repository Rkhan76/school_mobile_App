import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getClassesMaster } from '../common/api';
import type { ClassWithSections } from '../common/types';
import { colors, fonts, radius } from '../../theme/tokens';
import { listExamTypes } from './api';
import type { ExamFilters, ExamStatusFilter, ExamType } from './types';

export const DEFAULT_FILTERS: ExamFilters = { examTypeId: 'all', status: 'all', classId: 'all' };

type Props = { visible: boolean; value: ExamFilters; onApply: (v: ExamFilters) => void; onClose: () => void };

function Chips<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{label}</Text>
      <View style={styles.options}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.opt, active && styles.optActive]}>
              <Text style={[styles.optText, active && styles.optTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ExamFilterSheet({ visible, value, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(value);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  useEffect(() => {
    listExamTypes().then(setExamTypes).catch(() => {});
    getClassesMaster().then(setClasses).catch(() => {});
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filters</Text>
        <ScrollView style={styles.scroll}>
          <Chips<string>
            label="Exam type"
            value={draft.examTypeId}
            onChange={(examTypeId) => setDraft((d) => ({ ...d, examTypeId }))}
            options={[{ value: 'all', label: 'All types' }, ...examTypes.map((t) => ({ value: t.id, label: t.name }))]}
          />
          <Chips<ExamStatusFilter>
            label="Status"
            value={draft.status}
            onChange={(status) => setDraft((d) => ({ ...d, status }))}
            options={[
              { value: 'all', label: 'All' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <Chips<string>
            label="Class"
            value={draft.classId}
            onChange={(classId) => setDraft((d) => ({ ...d, classId }))}
            options={[{ value: 'all', label: 'All classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </ScrollView>
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => setDraft(DEFAULT_FILTERS)}>
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
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, paddingBottom: 32, maxHeight: '85%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  group: { marginBottom: 14 },
  groupTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  optActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  optTextActive: { color: colors.white },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white },
});
