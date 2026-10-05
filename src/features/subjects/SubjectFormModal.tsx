import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { SubjectInput, SubjectWithAssignments } from './types';

type Props = {
  visible: boolean;
  /** null = add mode */
  subject: SubjectWithAssignments | null;
  /** codes already used by other subjects (uppercase) */
  takenCodes: string[];
  onSubmit: (input: SubjectInput) => void;
  onClose: () => void;
};

type Errors = Partial<Record<keyof SubjectInput, string>>;

export function SubjectFormModal({ visible, subject, takenCodes, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setName(subject?.name ?? '');
      setCode(subject?.subjectCode ?? '');
      setDescription(subject?.description ?? '');
      setErrors({});
    }
  }, [visible, subject]);

  const submit = () => {
    const e: Errors = {};
    const n = name.trim();
    const c = code.trim().toUpperCase();
    if (n.length < 2) e.name = 'Name must be at least 2 characters.';
    if (!c) e.subjectCode = 'Subject code is required.';
    else if (!/^[A-Z0-9_-]{1,10}$/.test(c)) e.subjectCode = 'Use up to 10 letters, numbers, - or _.';
    else if (takenCodes.includes(c)) e.subjectCode = 'This subject code is already in use.';
    if (description.trim().length > 200) e.description = 'Description must be 200 characters or fewer.';
    setErrors(e);
    if (Object.keys(e).length === 0) onSubmit({ name: n, subjectCode: c, description: description.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.box}>
          <Text style={styles.title}>{subject ? 'Edit subject' : 'Add subject'}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="e.g. Mathematics"
              placeholderTextColor={colors.textHint} style={[styles.input, !!errors.name && styles.inputErr]}
            />
            {errors.name ? <Text style={styles.err}>{errors.name}</Text> : null}

            <Text style={styles.label}>Subject code</Text>
            <TextInput
              value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="e.g. MATH"
              placeholderTextColor={colors.textHint} autoCapitalize="characters" autoCorrect={false}
              style={[styles.input, styles.mono, !!errors.subjectCode && styles.inputErr]}
            />
            {errors.subjectCode ? <Text style={styles.err}>{errors.subjectCode}</Text> : null}

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description} onChangeText={setDescription} placeholder="Optional"
              placeholderTextColor={colors.textHint} multiline
              style={[styles.input, styles.multi, !!errors.description && styles.inputErr]}
            />
            {errors.description ? <Text style={styles.err}>{errors.description}</Text> : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={submit}>
              <Text style={styles.saveText}>{subject ? 'Save changes' : 'Add subject'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 10, maxHeight: '90%' },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  form: { gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  mono: { fontFamily: fonts.monoMedium },
  multi: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
}));
