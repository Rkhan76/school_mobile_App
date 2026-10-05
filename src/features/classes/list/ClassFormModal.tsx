import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import { GRADE_OPTIONS } from '../grades';
import type { AcademicClass, ClassInput } from '../types';

interface Props {
  visible: boolean;
  /** When set, the form edits this class; otherwise it creates a new one. */
  editing: AcademicClass | null;
  nextOrder: number;
  /** Resolves with an error to show (nameError -> inline on the name field) or void on success. */
  onSubmit: (input: ClassInput) => Promise<{ nameError?: string; error?: string } | void>;
  onClose: () => void;
}

export function ClassFormModal({ visible, editing, nextOrder, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverNameError, setServerNameError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(editing?.name ?? '');
    setOrder(String(editing?.gradeOrder ?? Math.min(nextOrder, GRADE_OPTIONS[GRADE_OPTIONS.length - 1].value)));
    setDescription(editing?.description ?? '');
    setTouched(false);
    setSaving(false);
    setServerNameError(null);
    setServerError(null);
    // Only re-seed when the modal opens or the edited class changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

  const nameError = name.trim().length === 0 ? 'Class name is required.' : null;
  const orderNum = Number(order);
  const orderError = !Number.isInteger(orderNum) || orderNum < 0 ? 'Choose a grade.' : null;
  const gradeChoices = GRADE_OPTIONS.some((g) => g.value === orderNum) || !Number.isInteger(orderNum)
    ? GRADE_OPTIONS
    : [...GRADE_OPTIONS, { value: orderNum, label: String(orderNum) }];

  const submit = async () => {
    setTouched(true);
    setServerNameError(null);
    setServerError(null);
    if (nameError || orderError || saving) return;
    setSaving(true);
    try {
      const res = await onSubmit({ name: name.trim(), gradeOrder: orderNum, description: description.trim() });
      if (res?.nameError) setServerNameError(res.nameError);
      else if (res?.error) setServerError(res.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{editing ? 'Edit Class' : 'Add Class'}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setServerNameError(null);
                }}
                placeholder="e.g. Class 1"
                placeholderTextColor={colors.textHint}
                style={styles.input}
                autoFocus
                maxLength={100}
              />
              {touched && nameError ? <Text style={styles.err}>{nameError}</Text> : null}
              {serverNameError ? <Text style={styles.err}>{serverNameError}</Text> : null}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Grade order</Text>
              <View style={styles.grades}>
                {gradeChoices.map((g) => {
                  const on = g.value === orderNum;
                  return (
                    <Pressable
                      key={g.value}
                      onPress={() => setOrder(String(g.value))}
                      style={[styles.grade, on && styles.gradeOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.gradeText, on && styles.gradeTextOn]}>{g.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {touched && orderError ? <Text style={styles.err}>{orderError}</Text> : null}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional"
                placeholderTextColor={colors.textHint}
                multiline
                style={[styles.input, styles.multiline]}
              />
            </View>
            {serverError ? <Text style={styles.err}>{serverError}</Text> : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Class'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, paddingBottom: 28, maxHeight: '90%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 12 },
  form: { gap: 14, paddingBottom: 8 },
  field: { gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  multiline: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  grades: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grade: { paddingHorizontal: 12, height: 34, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: colors.mint, borderWidth: 1, borderColor: colors.mint },
  gradeOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  gradeText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.primaryDeep },
  gradeTextOn: { color: colors.white },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
}));
