import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { colors, fonts, radius } from '../../../theme/tokens';
import type { AcademicClass, ClassInput } from '../mockClasses';

interface Props {
  visible: boolean;
  /** When set, the form edits this class; otherwise it creates a new one. */
  editing: AcademicClass | null;
  nextOrder: number;
  onSubmit: (input: ClassInput) => void;
  onClose: () => void;
}

export function ClassFormModal({ visible, editing, nextOrder, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(editing?.name ?? '');
    setOrder(String(editing?.gradeOrder ?? nextOrder));
    setDescription(editing?.description ?? '');
    setTouched(false);
    // Only re-seed when the modal opens or the edited class changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

  const nameError = name.trim().length === 0 ? 'Class name is required.' : null;
  const orderNum = Number(order);
  const orderError = !Number.isInteger(orderNum) || orderNum < 1 ? 'Enter a whole number (1 or more).' : null;

  const submit = () => {
    setTouched(true);
    if (nameError || orderError) return;
    onSubmit({ name: name.trim(), gradeOrder: orderNum, description: description.trim() });
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
                onChangeText={setName}
                placeholder="e.g. Class 1"
                placeholderTextColor={colors.textHint}
                style={styles.input}
                autoFocus
              />
              {touched && nameError ? <Text style={styles.err}>{nameError}</Text> : null}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Grade order</Text>
              <TextInput
                value={order}
                onChangeText={setOrder}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.textHint}
                style={styles.input}
              />
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
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={submit}>
              <Text style={styles.saveText}>{editing ? 'Save Changes' : 'Add Class'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
