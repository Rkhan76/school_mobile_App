import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';

type Props = {
  visible: boolean;
  /** Return an error message to keep the dialog open, or null on success. */
  onSubmit: (name: string) => string | null;
  onClose: () => void;
};

/** Small centered dialog for adding a category. */
export function AddCategoryModal({ visible, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    const err = onSubmit(name);
    if (err) setError(err);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog}>
          <Text style={styles.title}>Add category</Text>
          <TextInput
            value={name}
            onChangeText={(t) => { setName(t); setError(null); }}
            placeholder="Category name"
            placeholderTextColor={colors.textHint}
            autoFocus
            maxLength={40}
            onSubmitEditing={submit}
            style={[styles.input, !!error && styles.inputErr]}
          />
          {error ? <Text style={styles.err}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={submit}>
              <Text style={styles.saveText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(10,51,48,0.45)' },
  dialog: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 10 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  input: {
    height: 46, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
