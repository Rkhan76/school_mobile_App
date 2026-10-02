import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { getClassesMaster } from '../common/api';
import type { ClassWithSections } from '../common/types';
import { ApiError } from '../../lib/apiClient';
import { inputToIso, todayIso } from './dateUtils';
import { Chip } from './parts';
import type { BulkCreateInput, DocumentType } from './types';

type Props = {
  visible: boolean;
  types: DocumentType[];
  onSubmit: (input: BulkCreateInput) => void;
  onClose: () => void;
};

type Errors = Partial<Record<'type' | 'due' | 'class', string>>;

/** Bulk requests only support "every student in a class/section" (no generic
 * "pick any person across entity types" endpoint exists) — so the picker is
 * restricted to document types that apply to STUDENT. */
export function BulkRequestModal({ visible, types, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [typeId, setTypeId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState(''); // '' = every section in the class
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const studentTypes = useMemo(() => types.filter((t) => t.appliesTo === 'STUDENT'), [types]);

  useEffect(() => {
    if (!visible) return;
    setTypeId('');
    setClassId('');
    setSectionId('');
    setDue('');
    setNote('');
    setErrors({});
    setLoadingClasses(true);
    getClassesMaster()
      .then(setClasses)
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : 'Could not load classes.';
        setErrors((e) => ({ ...e, class: msg }));
      })
      .finally(() => setLoadingClasses(false));
  }, [visible]);

  const selectedClass = classes.find((c) => c.id === classId);

  const pickClass = (id: string) => {
    setClassId(id);
    setSectionId('');
  };

  const submit = () => {
    const e: Errors = {};
    if (!typeId) e.type = 'Pick a document type.';
    if (!classId) e.class = 'Pick a class.';
    let iso: string | undefined;
    if (due.trim()) {
      const parsed = inputToIso(due);
      if (!parsed) e.due = 'Enter a valid date as DD/MM/YYYY.';
      else if (parsed < todayIso()) e.due = 'Due date cannot be in the past.';
      else iso = parsed;
    }
    setErrors(e);
    if (Object.keys(e).length === 0) {
      onSubmit({
        documentTypeId: typeId,
        classId,
        sectionId: sectionId || undefined,
        dueDate: iso,
        note: note.trim() || undefined,
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close form">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>Bulk request</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Document type *</Text>
          <View style={styles.wrap}>
            {studentTypes.map((t) => (
              <Chip key={t.id} label={t.name} on={t.id === typeId} onPress={() => setTypeId(t.id)} />
            ))}
          </View>
          {studentTypes.length === 0 ? <Text style={styles.hint}>No document types apply to students yet.</Text> : null}
          {errors.type ? <Text style={styles.err}>{errors.type}</Text> : null}

          <Text style={styles.label}>Class *</Text>
          {loadingClasses ? <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', marginTop: 6 }} /> : (
            <View style={styles.wrap}>
              {classes.map((c) => (
                <Chip key={c.id} label={c.name} on={c.id === classId} onPress={() => pickClass(c.id)} />
              ))}
            </View>
          )}
          {errors.class ? <Text style={styles.err}>{errors.class}</Text> : null}

          {selectedClass && selectedClass.sections.length > 0 ? (
            <>
              <Text style={styles.label}>Section</Text>
              <View style={styles.wrap}>
                <Chip label="All sections" on={sectionId === ''} onPress={() => setSectionId('')} />
                {selectedClass.sections.map((s) => (
                  <Chip key={s.id} label={s.name} on={s.id === sectionId} onPress={() => setSectionId(s.id)} />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Due date</Text>
          <TextInput
            value={due} onChangeText={setDue} placeholder="DD/MM/YYYY (optional)" placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.due && styles.inputErr]}
          />
          {errors.due ? <Text style={styles.err}>{errors.due}</Text> : null}

          <Text style={styles.label}>Note</Text>
          <TextInput
            value={note} onChangeText={setNote} placeholder="Optional note" placeholderTextColor={colors.textHint}
            style={styles.input}
          />
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit}>
            <Text style={styles.saveText}>Send request</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  form: { paddingHorizontal: 16, gap: 6, paddingBottom: 16 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid,
  },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
