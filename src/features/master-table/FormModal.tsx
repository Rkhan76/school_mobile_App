import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import type { FieldDef, FormValues } from './config';

type Props = {
  visible: boolean;
  title: string;
  submitLabel: string;
  fields: FieldDef[];
  initial: FormValues;
  validate: (v: FormValues) => Record<string, string>;
  onSubmit: (v: FormValues) => void;
  onClose: () => void;
};

export function FormModal({ visible, title, submitLabel, fields, initial, validate, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setValues(initial);
      setErrors({});
      setSubmitted(false);
    }
    // Reset only when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const set = (key: string, v: string | boolean) => {
    const next = { ...values, [key]: v };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  const submit = () => {
    const err = validate(values);
    setErrors(err);
    setSubmitted(true);
    if (Object.keys(err).length === 0) onSubmit(values);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.fields} showsVerticalScrollIndicator={false}>
            {fields.map((f) => {
              const v = values[f.key];
              if (f.kind === 'toggle') {
                return (
                  <View key={f.key} style={styles.toggleRow}>
                    <Text style={styles.label}>{f.label}</Text>
                    <Switch
                      value={v === true}
                      onValueChange={(x) => set(f.key, x)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.white}
                    />
                  </View>
                );
              }
              const err = errors[f.key];
              return (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    value={typeof v === 'string' ? v : ''}
                    onChangeText={(t) => set(f.key, t)}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textHint}
                    multiline={f.kind === 'multiline'}
                    keyboardType={f.kind === 'number' ? 'number-pad' : f.kind === 'date' || f.kind === 'time' ? 'numbers-and-punctuation' : 'default'}
                    maxLength={f.kind === 'date' ? 10 : f.kind === 'time' ? 5 : undefined}
                    style={[styles.input, f.kind === 'multiline' && styles.multiline, err ? styles.inputErr : null]}
                  />
                  {err ? <Text style={styles.err}>{err}</Text> : null}
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={submit}>
              <Text style={styles.saveText}>{submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 12, maxHeight: '90%' },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  fields: { gap: 12 },
  field: { gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  input: {
    minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
