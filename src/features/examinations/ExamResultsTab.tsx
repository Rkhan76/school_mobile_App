import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { OptionSheet } from './OptionSheet';
import {
  formatDateLong, gradeFor, markError, useExamResults, useExams, type ExamSchedule, type ExamStudent,
} from './mockExams';

const ALL_PARAMS = { search: '', examType: 'All', status: 'all', className: 'All', page: 1, pageSize: 1 } as const;

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumItem}>
      <Text style={styles.sumValue}>{value}</Text>
      <Text style={styles.sumLabel}>{label}</Text>
    </View>
  );
}

function StudentRow({ student, exam, value, onChange }: {
  student: ExamStudent; exam: ExamSchedule; value: string; onChange: (id: string, v: string) => void;
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
        keyboardType="decimal-pad"
        placeholder="-"
        placeholderTextColor={colors.textHint}
        maxLength={6}
        style={[styles.markInput, err ? styles.markErr : null]}
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
  const { all } = useExams(ALL_PARAMS);
  const [examId, setExamId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const exam = useMemo(() => all.find((e) => e.id === examId) ?? null, [all, examId]);
  const { students, marks, setMark, save, summary, isLoading, hasErrors, dirty } = useExamResults(exam);

  const options = useMemo(
    () => all.map((e) => ({
      value: e.id,
      label: e.title,
      sub: `${e.className} - ${e.sectionName} · ${formatDateLong(e.examDate)} · ${e.status === 'completed' ? 'Completed' : 'Upcoming'}`,
    })),
    [all],
  );

  const onSave = () => {
    if (save()) Alert.alert('Results saved', `Marks for ${exam?.title ?? 'exam'} were saved.`);
    else Alert.alert('Cannot save', 'Fix the invalid marks first.');
  };

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
          <Text style={styles.sumTitle}>Summary</Text>
          <View style={styles.sumRow}>
            <SummaryItem label="Average" value={summary.entered ? summary.average.toFixed(1) : '-'} />
            <SummaryItem label="Pass %" value={summary.entered ? `${Math.round(summary.passPercent)}%` : '-'} />
            <SummaryItem label="Highest" value={summary.entered ? String(summary.highest) : '-'} />
            <SummaryItem label="Entered" value={`${summary.entered}/${students.length}`} />
          </View>
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
            <StudentRow student={item} exam={exam as ExamSchedule} value={marks[item.id] ?? ''} onChange={setMark} />
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
        contentContainerStyle={{ paddingBottom: (exam ? 90 : 0) + insets.bottom + 24, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      {exam && !isLoading && students.length > 0 ? (
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={[styles.saveBtn, (hasErrors || !dirty) && styles.saveOff]}
            disabled={hasErrors || !dirty}
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
  sumTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  sumRow: { flexDirection: 'row' },
  sumItem: { flex: 1, alignItems: 'center', gap: 2 },
  sumValue: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.text },
  sumLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
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
