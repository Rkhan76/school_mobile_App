import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { getAcademicYearsMaster, getClassesMaster } from '../common/api';
import type { AcademicYearLean, ClassWithSections } from '../common/types';
import { listExamTypes, lookupSubjects, lookupTeachersForPicker } from './api';
import { OptionSheet } from './OptionSheet';
import { formatDate, parseDate } from './types';
import type { ExamInput, ExamSchedule, ExamType, LookupItem, MutationResult, TeacherLookupItem } from './types';

type Props = {
  visible: boolean;
  /** When set the form edits this exam, otherwise it creates one. */
  exam: ExamSchedule | null;
  onSubmit: (input: ExamInput) => Promise<MutationResult>;
  onClose: () => void;
};

type Form = {
  title: string; examTypeId: string; classId: string; sectionId: string; subjectId: string;
  date: string; maxMarks: string; passingMarks: string; duration: string; invigilatorId: string;
};
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
  title: '', examTypeId: '', classId: '', sectionId: '', subjectId: '',
  date: '', maxMarks: '', passingMarks: '', duration: '', invigilatorId: '',
};

function toForm(e: ExamSchedule): Form {
  return {
    title: e.title, examTypeId: e.examTypeId, classId: e.classId, sectionId: e.sectionId ?? '', subjectId: e.subjectId,
    date: formatDate(e.examDate), maxMarks: String(e.maxMarks), passingMarks: String(e.passingMarks),
    duration: String(e.durationMinutes), invigilatorId: e.invigilatorId ?? '',
  };
}

const isPosInt = (s: string) => /^\d+$/.test(s.trim()) && Number(s) > 0;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.title.trim()) e.title = 'Title is required';
  if (!f.examTypeId) e.examTypeId = 'Select an exam type';
  if (!f.classId) e.classId = 'Select a class';
  if (!f.subjectId) e.subjectId = 'Select a subject';
  if (!f.date.trim()) e.date = 'Date is required';
  else if (!parseDate(f.date)) e.date = 'Use a valid DD/MM/YYYY date';
  if (!isPosInt(f.maxMarks)) e.maxMarks = 'Enter max marks';
  if (!/^\d+$/.test(f.passingMarks.trim())) e.passingMarks = 'Enter passing marks';
  else if (isPosInt(f.maxMarks) && Number(f.passingMarks) > Number(f.maxMarks)) e.passingMarks = 'Cannot exceed max marks';
  if (!isPosInt(f.duration)) e.duration = 'Enter duration in minutes';
  return e;
}

function ChipField({ label, options, value, onChange, error, optional }: {
  label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
  error?: string; optional?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{optional ? '' : ' *'}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

function TextField({ label, value, onChangeText, error, placeholder, numeric }: {
  label: string; value: string; onChangeText: (v: string) => void; error?: string; placeholder?: string; numeric?: boolean;
}) {
  return (
    <View style={[styles.field, numeric && styles.half]}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        keyboardType={numeric ? 'number-pad' : 'default'}
        style={[styles.input, error ? styles.inputErr : null]}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

export function ExamFormModal({ visible, exam, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [subjects, setSubjects] = useState<LookupItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherLookupItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearLean[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [invigilatorPickerOpen, setInvigilatorPickerOpen] = useState(false);

  useEffect(() => {
    setLoadingOptions(true);
    Promise.all([
      listExamTypes(),
      getClassesMaster(),
      lookupSubjects(),
      lookupTeachersForPicker(),
      getAcademicYearsMaster(),
    ])
      .then(([types, cls, subs, tchrs, years]) => {
        setExamTypes(types);
        setClasses(cls);
        setSubjects(subs);
        setTeachers(tchrs);
        setAcademicYears(years);
      })
      .catch(() => {
        /* chips just render empty; the inline validation will catch missing selections */
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  useEffect(() => {
    if (visible) {
      setForm(exam ? toForm(exam) : EMPTY);
      setErrors({});
      setApiError(null);
    }
  }, [visible, exam]);

  useEffect(() => {
    if (!visible) return;
    if (exam) {
      setAcademicYearId(exam.academicYearId);
      return;
    }
    const active = academicYears.find((y) => y.isActive) ?? academicYears[0];
    setAcademicYearId(active ? active.id : null);
  }, [visible, exam, academicYears]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const selectedClass = classes.find((c) => c.id === form.classId);
  const sectionOptions = [
    { value: '', label: 'Whole class' },
    ...(selectedClass?.sections ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];

  const pickClass = (classId: string) => {
    setForm((f) => ({ ...f, classId, sectionId: '' }));
    setErrors((e) => ({ ...e, classId: undefined }));
  };

  const invigilatorLabel = form.invigilatorId
    ? teachers.find((t) => t.id === form.invigilatorId)?.fullName ?? 'Selected'
    : 'None';

  const submit = async () => {
    const errs = validate(form);
    setErrors(errs);
    const iso = parseDate(form.date);
    if (Object.keys(errs).length > 0 || !iso) return;
    if (!academicYearId) {
      setApiError('No academic year is set up for this school yet.');
      return;
    }
    setApiError(null);
    setSubmitting(true);
    const result = await onSubmit({
      academicYearId,
      examTypeId: form.examTypeId,
      title: form.title.trim(),
      classId: form.classId,
      sectionId: form.sectionId ? form.sectionId : null,
      subjectId: form.subjectId,
      examDate: iso,
      maxMarks: Number(form.maxMarks),
      passingMarks: Number(form.passingMarks),
      durationMinutes: Number(form.duration),
      invigilatorId: form.invigilatorId ? form.invigilatorId : null,
    });
    setSubmitting(false);
    if (result.ok) onClose();
    else setApiError(result.message);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.heading}>{exam ? 'Edit Schedule' : 'Add Schedule'}</Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {loadingOptions ? <ActivityIndicator color={colors.primary} /> : null}
          {apiError ? (
            <View style={styles.apiErrBox}>
              <Text style={styles.apiErrText}>{apiError}</Text>
            </View>
          ) : null}
          <TextField label="Title" value={form.title} onChangeText={(v) => set('title', v)} error={errors.title} placeholder="e.g. Unit Test 1 — Maths" />
          <ChipField
            label="Exam type"
            options={examTypes.map((t) => ({ value: t.id, label: t.name }))}
            value={form.examTypeId}
            onChange={(v) => set('examTypeId', v)}
            error={errors.examTypeId}
          />
          <ChipField
            label="Class"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            value={form.classId}
            onChange={pickClass}
            error={errors.classId}
          />
          <ChipField
            label="Section"
            options={sectionOptions}
            value={form.sectionId}
            onChange={(v) => set('sectionId', v)}
            optional
          />
          <ChipField
            label="Subject"
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            value={form.subjectId}
            onChange={(v) => set('subjectId', v)}
            error={errors.subjectId}
          />
          <View style={styles.field}>
            <Text style={styles.label}>Invigilator</Text>
            <Pressable style={styles.picker} onPress={() => setInvigilatorPickerOpen(true)}>
              <Text style={styles.pickerText}>{invigilatorLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <TextField label="Exam date" value={form.date} onChangeText={(v) => set('date', v)} error={errors.date} placeholder="DD/MM/YYYY" />
          <View style={styles.pair}>
            <TextField numeric label="Max marks" value={form.maxMarks} onChangeText={(v) => set('maxMarks', v)} error={errors.maxMarks} />
            <TextField numeric label="Passing marks" value={form.passingMarks} onChangeText={(v) => set('passingMarks', v)} error={errors.passingMarks} />
          </View>
          <TextField numeric label="Duration (min)" value={form.duration} onChangeText={(v) => set('duration', v)} error={errors.duration} />
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save, submitting && styles.saveOff]} onPress={submit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveText}>{exam ? 'Save changes' : 'Add schedule'}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <OptionSheet
        visible={invigilatorPickerOpen}
        title="Select invigilator"
        value={form.invigilatorId || null}
        options={[{ value: '', label: 'None' }, ...teachers.map((t) => ({ value: t.id, label: t.fullName }))]}
        onClose={() => setInvigilatorPickerOpen(false)}
        onSelect={(v) => { set('invigilatorId', v); setInvigilatorPickerOpen(false); }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  body: { paddingHorizontal: 16, gap: 14 },
  field: { gap: 6 },
  half: { flex: 1 },
  pair: { flexDirection: 'row', gap: 10 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  input: {
    height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  picker: {
    height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cardSolid,
  },
  pickerText: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  apiErrBox: { padding: 12, borderRadius: radius.md, backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder },
  apiErrText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveOff: { opacity: 0.6 },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
