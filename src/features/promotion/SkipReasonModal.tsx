import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';

type Props = { visible: boolean; count: number; onSubmit: (reason: string) => void; onClose: () => void };

export function SkipReasonModal({ visible, count, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);
  const valid = reason.trim().length >= 5;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.box}>
          <Text style={styles.title}>Skip class{count > 1 ? ` (${count} students)` : ''}</Text>
          <Text style={styles.sub}>A reason is required (at least 5 characters).</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for skipping a class"
            placeholderTextColor={colors.textHint}
            multiline
            autoFocus
            style={styles.input}
          />
          {reason.length > 0 && !valid ? <Text style={styles.err}>Reason must be at least 5 characters.</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.ok, !valid && styles.disabled]} disabled={!valid} onPress={() => onSubmit(reason.trim())}>
              <Text style={styles.okText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 10 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  input: {
    minHeight: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: 12, fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  ok: { backgroundColor: colors.primary },
  okText: { fontFamily: fonts.bodySemi, color: colors.white },
  disabled: { opacity: 0.45 },
});
