import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { OptionSheet } from './OptionSheet';
import { formatDateLong, gradeFor, markError } from './types';
import type { ExamSchedule, ExamStudent } from './types';
import { useExamResults, useExams } from './useExams';

const ALL_PARAMS = { search: '', examTypeId: 'all', status: 'all' as const, classId: 'all' };

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumItem}>
      <Text style={styles.sumValue}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </View>
  );
}

function StudentRow({ student, exam, value, editable, onChange }: {
  student: ExamStudent; exam: ExamSchedule; value: string; editable: boolean; onChange: (id: string, v: string) => void;
}) {
  const err = markError(value, exam.maxMarks);
  const filled = value.trim() !== '' && !err;
  const res = filled ? gradeFor(Number(value), exam.maxMarks, exam.passingMarks) : null;
  return (
    <View style={styles.row}>
      <Text style={styles.roll}>{student.rollNo}</Text>
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
        {err ? <Text style={styles.err}>{err}</Text> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(student.id, v)}
        editable={editable}
        keyboardType="decimal-pad"
        placeholder="-"
        placeholderTextColor={colors.textHint}
        maxLength={6}
        style={[styles.markInput, err ? styles.markErr : null, !editable && styles.markDisabled]}
        accessibilityLabel={`Marks for ${student.name}`}
      />
      <Text style={styles.outOf}>/{exam.maxMarks}</Text>
      <View style={styles.resCol}>
        {res ? (
          <View style={[styles.pill, { backgroundColor: res.pass ? colors.successBg : colors.dangerBg }]}>
            <Text style={[styles.pillText, { color: res.pass ? colors.success : colors.danger }]}>
              {res.grade} · {res.pass ? 'Pass' : 'Fail'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ExamResultsTab() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canEnterResults = permissions.includes('exam-result.record.create');
  const canPublish = permissions.includes('exam-result.lock.update');

  const { all } = useExams(ALL_PARAMS);
  const [examId, setExamId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const exam = useMemo(() => all.find((e) => e.id === examId) ?? null, [all, examId]);
  const { students, marks, setMark, save, publish, summary, isLoading, hasErrors, dirty, locked } = useExamResults(exam);

  const options = useMemo(
    () => all.map((e) => ({
      value: e.id,
      label: e.title,
      sub: `${e.className} - ${e.sectionName} · ${formatDateLong(e.examDate)} · ${e.status === 'completed' ? 'Completed' : 'Upcoming'}`,
    })),
    [all],
  );

  const onSave = async () => {
    const result = await save();
    if (result.ok) Alert.alert('Results saved', `Marks for ${exam?.title ?? 'exam'} were saved.`);
    else Alert.alert('Cannot save', result.message);
  };

  const onPublish = () => {
    if (!exam) return;
    Alert.alert(
      'Publish results',
      `This permanently locks every result for "${exam.title}". Locked results can no longer be edited or deleted. This cannot be undone. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish', style: 'destructive',
          onPress: async () => {
            const result = await publish();
            if (result.ok) Alert.alert('Published', `${result.locked ?? 0} result(s) locked.`);
            else Alert.alert('Could not publish', result.message);
          },
        },
      ],
    );
  };

  const canEditMarks = canEnterResults && !locked;
  const editable = !isLoading;

  const header = (
    <View style={styles.headerWrap}>
      <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
        <View style={styles.pickerText}>
          <Text style={styles.pickerLabel}>Exam</Text>
          <Text style={styles.pickerValue} numberOfLines={1}>{exam ? exam.title : 'Select an exam'}</Text>
          {exam ? (
            <Text style={styles.pickerSub} numberOfLines={1}>
              {exam.className} - {exam.sectionName} · {formatDateLong(exam.examDate)} · {exam.maxMarks} marks (pass {exam.passingMarks})
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>
      {exam && !isLoading ? (
        <Card style={styles.summary}>
          <View style={styles.sumTop}>
            <Text style={styles.sumTitle}>Summary</Text>
            {locked ? (
              <View style={styles.lockedPill}>
                <Ionicons name="lock-closed" size={11} color={colors.textSecondary} />
                <Text style={styles.lockedText}>Published</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.sumRow}>
            <SummaryItem label="Average" value={summary.entered ? summary.average.toFixed(1) : '-'} />
            <SummaryItem label="Pass %" value={summary.entered ? `${Math.round(summary.passPercent)}%` : '-'} />
            <SummaryItem label="Highest" value={summary.entered ? String(summary.highest) : '-'} />
            <SummaryItem label="Entered" value={`${summary.entered}/${students.length}`} />
          </View>
          {canPublish && !locked ? (
            <Pressable style={styles.publishBtn} onPress={onPublish} accessibilityLabel="Publish results">
              <Ionicons name="ribbon-outline" size={15} color={colors.primaryDeep} />
              <Text style={styles.publishText}>Publish results</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={exam && !isLoading ? students : []}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <StudentRow
              student={item}
              exam={exam as ExamSchedule}
              value={marks[item.id] ?? ''}
              editable={canEditMarks}
              onChange={setMark}
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="ribbon-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>{exam ? 'No students found' : 'No exam selected'}</Text>
              <Text style={styles.emptySub}>{exam ? 'This class has no students.' : 'Pick an exam to enter or view results.'}</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: (exam && canEditMarks ? 90 : 0) + insets.bottom + 24, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      {exam && !isLoading && students.length > 0 && canEditMarks ? (
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={[styles.saveBtn, (hasErrors || !dirty || !editable) && styles.saveOff]}
            disabled={hasErrors || !dirty || !editable}
            onPress={onSave}
          >
            <Ionicons name="save-outline" size={18} color={colors.white} />
            <Text style={styles.saveText}>Save results</Text>
          </Pressable>
        </View>
      ) : null}
      <OptionSheet
        visible={pickerOpen}
        title="Select exam"
        options={options}
        value={examId}
        onClose={() => setPickerOpen(false)}
        onSelect={(v) => { setExamId(v); setPickerOpen(false); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  pickerText: { flex: 1 },
  pickerLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textHint },
  pickerValue: { fontFamily: fonts.heading, fontSize: 15, color: colors.text, marginTop: 2 },
  pickerSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  summary: { gap: 10 },
  sumTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sumTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  lockedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.mintSoft },
  lockedText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  sumRow: { flexDirection: 'row' },
  sumItem: { flex: 1, alignItems: 'center', gap: 2 },
  sumValue: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.text },
  sumLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42,
    borderRadius: radius.md, backgroundColor: colors.mint,
  },
  publishText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  itemWrap: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.md,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  roll: { width: 24, fontFamily: fonts.mono, fontSize: 12, color: colors.textHint },
  nameCol: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  err: { fontFamily: fonts.body, fontSize: 11, color: colors.danger },
  markInput: {
    width: 54, height: 38, textAlign: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft, padding: 0,
  },
  markErr: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  markDisabled: { opacity: 0.6 },
  outOf: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint, width: 28 },
  resCol: { width: 74, alignItems: 'flex-end' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 10 },
  loader: { marginTop: 40 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  saveBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 16,
    backgroundColor: colors.cardSolid, borderTopWidth: 1, borderTopColor: colors.border,
  },
  saveBtn: {
    height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: radius.lg, backgroundColor: colors.primary,
  },
  saveOff: { opacity: 0.45 },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
});
