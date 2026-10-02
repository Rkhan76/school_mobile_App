import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import {
  CLASS_OPTIONS, EXAM_TYPES, EXAM_TYPE_NAMES, SECTION_OPTIONS, SUBJECT_OPTIONS,
  formatDate, parseDate, type ExamInput, type ExamSchedule,
} from './mockExams';

type Props = {
  visible: boolean;
  /** When set the form edits this exam, otherwise it creates one. */
  exam: ExamSchedule | null;
  onSubmit: (input: ExamInput) => void;
  onClose: () => void;
};

type Form = {
  title: string; examType: string; className: string; sectionName: string; subject: string;
  date: string; maxMarks: string; passingMarks: string; duration: string;
};
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
  title: '', examType: '', className: '', sectionName: 'A', subject: '',
  date: '', maxMarks: '', passingMarks: '', duration: '',
};

function toForm(e: ExamSchedule): Form {
  return {
    title: e.title, examType: e.examType, className: e.className, sectionName: e.sectionName, subject: e.subject,
    date: formatDate(e.examDate), maxMarks: String(e.maxMarks), passingMarks: String(e.passingMarks),
    duration: String(e.durationMinutes),
  };
}

const isPosInt = (s: string) => /^\d+$/.test(s.trim()) && Number(s) > 0;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.title.trim()) e.title = 'Title is required';
  if (!f.examType) e.examType = 'Select an exam type';
  if (!f.className) e.className = 'Select a class';
  if (!f.sectionName) e.sectionName = 'Select a section';
  if (!f.subject) e.subject = 'Select a subject';
  if (!f.date.trim()) e.date = 'Date is required';
  else if (!parseDate(f.date)) e.date = 'Use a valid DD/MM/YYYY date';
  if (!isPosInt(f.maxMarks)) e.maxMarks = 'Enter max marks';
  if (!/^\d+$/.test(f.passingMarks.trim())) e.passingMarks = 'Enter passing marks';
  else if (isPosInt(f.maxMarks) && Number(f.passingMarks) > Number(f.maxMarks)) e.passingMarks = 'Cannot exceed max marks';
  if (!isPosInt(f.duration)) e.duration = 'Enter duration in minutes';
  return e;
}

function ChipField({ label, options, value, onChange, error }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} *</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const active = o === value;
          return (
            <Pressable key={o} onPress={() => onChange(o)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
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

  useEffect(() => {
    if (visible) {
      setForm(exam ? toForm(exam) : EMPTY);
      setErrors({});
    }
  }, [visible, exam]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pickType = (name: string) => {
    const t = EXAM_TYPES.find((x) => x.name === name);
    setForm((f) => ({
      ...f,
      examType: name,
      maxMarks: !exam && t && !f.maxMarks ? String(t.max) : f.maxMarks,
      passingMarks: !exam && t && !f.passingMarks ? String(t.pass) : f.passingMarks,
      duration: !exam && t && !f.duration ? String(t.minutes) : f.duration,
    }));
    setErrors((e) => ({ ...e, examType: undefined }));
  };

  const submit = () => {
    const errs = validate(form);
    setErrors(errs);
    const iso = parseDate(form.date);
    if (Object.keys(errs).length > 0 || !iso) return;
    onSubmit({
      title: form.title.trim(),
      examType: form.examType,
      className: form.className,
      sectionName: form.sectionName,
      subject: form.subject,
      examDate: iso,
      maxMarks: Number(form.maxMarks),
      passingMarks: Number(form.passingMarks),
      durationMinutes: Number(form.duration),
    });
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
          <TextField label="Title" value={form.title} onChangeText={(v) => set('title', v)} error={errors.title} placeholder="e.g. Unit Test 1 — Maths" />
          <ChipField label="Exam type" options={EXAM_TYPE_NAMES} value={form.examType} onChange={pickType} error={errors.examType} />
          <ChipField label="Class" options={CLASS_OPTIONS} value={form.className} onChange={(v) => set('className', v)} error={errors.className} />
          <ChipField label="Section" options={SECTION_OPTIONS} value={form.sectionName} onChange={(v) => set('sectionName', v)} error={errors.sectionName} />
          <ChipField label="Subject" options={SUBJECT_OPTIONS} value={form.subject} onChange={(v) => set('subject', v)} error={errors.subject} />
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
            <Pressable style={[styles.btn, styles.save]} onPress={submit}>
              <Text style={styles.saveText}>{exam ? 'Save changes' : 'Add schedule'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
