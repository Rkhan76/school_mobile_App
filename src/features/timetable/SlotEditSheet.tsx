import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import {
  DAY_LONG, SUBJECT_OPTIONS, TEACHER_OPTIONS, formatTime,
  type Day, type Option, type Period, type Slot, type SlotInput,
} from './mockTimetable';

type Props = {
  visible: boolean;
  day: Day;
  period: Period | null;
  slot: Slot | undefined;
  onSave: (input: SlotInput) => void;
  onClear: () => void;
  onClose: () => void;
};

type Open = 'subject' | 'teacher' | null;

function InlineSelect({
  label, value, placeholder, options, open, error, onToggle, onSelect,
}: {
  label: string; value: string; placeholder: string; options: Option[]; open: boolean; error?: string;
  onToggle: () => void; onSelect: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value)?.label;
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.field, !!error && styles.fieldError]} onPress={onToggle} accessibilityRole="button">
        <Text style={[styles.fieldText, !current && styles.placeholder]} numberOfLines={1}>{current ?? placeholder}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textHint} />
      </Pressable>
      {open ? (
        <ScrollView style={styles.list} nestedScrollEnabled>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable key={o.value} onPress={() => onSelect(o.value)} style={[styles.opt, active && styles.optActive]}>
                <Text style={[styles.optText, active && styles.optTextActive]}>{o.label}</Text>
                {active ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Bottom sheet to edit one timetable slot: subject, teacher, room. */
export function SlotEditSheet({ visible, day, period, slot, onSave, onClear, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [room, setRoom] = useState('');
  const [open, setOpen] = useState<Open>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setSubject(slot?.subject ?? '');
      setTeacherId(slot?.teacherId ?? '');
      setRoom(slot?.room ?? '');
      setOpen(null);
      setError('');
    }
  }, [visible, slot]);

  const save = () => {
    if (teacherId && !subject) {
      setError('Subject is required when a teacher is set');
      return;
    }
    if (!subject && !teacherId && !room.trim()) {
      onClear();
      return;
    }
    if (!subject) {
      setError('Select a subject');
      return;
    }
    onSave({ subject, teacherId, room });
  };

  const subjectOptions = SUBJECT_OPTIONS;
  const teacherOptions: Option[] = [{ value: '', label: 'No teacher' }, ...TEACHER_OPTIONS];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Edit slot</Text>
          {period ? (
            <Text style={styles.sub}>
              {DAY_LONG[day]} · {period.name} · {formatTime(period.startTime)} – {formatTime(period.endTime)}
            </Text>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <InlineSelect
              label="SUBJECT" value={subject} placeholder="Select subject" options={subjectOptions}
              open={open === 'subject'} error={error}
              onToggle={() => setOpen(open === 'subject' ? null : 'subject')}
              onSelect={(v) => {
                setSubject(v);
                setError('');
                setOpen(null);
              }}
            />
            <InlineSelect
              label="TEACHER" value={teacherId} placeholder="Select teacher" options={teacherOptions}
              open={open === 'teacher'}
              onToggle={() => setOpen(open === 'teacher' ? null : 'teacher')}
              onSelect={(v) => { setTeacherId(v); setError(''); setOpen(null); }}
            />
            <View style={styles.group}>
              <Text style={styles.label}>ROOM</Text>
              <TextInput
                value={room}
                onChangeText={setRoom}
                placeholder="e.g. Room 101"
                placeholderTextColor={colors.textHint}
                style={styles.input}
                maxLength={30}
              />
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClear} accessibilityRole="button">
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.btnText, { color: colors.danger }]}>Clear</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={save} accessibilityRole="button">
              <Text style={[styles.btnText, { color: colors.white }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  group: { gap: 4, marginTop: 10 },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary },
  field: {
    height: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  fieldError: { borderColor: colors.danger },
  fieldText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  placeholder: { color: colors.textHint, fontFamily: fonts.body },
  list: {
    maxHeight: 190, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.mintSoft,
  },
  opt: { height: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optActive: { backgroundColor: colors.mint },
  optText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  optTextActive: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  error: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  input: {
    height: 46, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border, fontFamily: fonts.body, fontSize: 14, color: colors.text,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: {
    height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  btnGhost: { flex: 1, backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder },
  btnPrimary: { flex: 2, backgroundColor: colors.primary },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});
