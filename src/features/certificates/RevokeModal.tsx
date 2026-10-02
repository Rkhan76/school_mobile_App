import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import type { Certificate } from './mockCertificates';

type Props = {
  certificate: Certificate | null;
  onConfirm: (id: string, reason: string) => void;
  onClose: () => void;
};

export function RevokeModal({ certificate, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (certificate) {
      setReason('');
      setError('');
    }
  }, [certificate]);

  const submit = () => {
    if (!certificate) return;
    if (reason.trim().length < 5) {
      setError('Please enter a reason of at least 5 characters.');
      return;
    }
    onConfirm(certificate.id, reason.trim());
  };

  return (
    <Modal visible={certificate !== null} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {certificate && (
          <View style={styles.box}>
            <Text style={styles.title}>Revoke certificate</Text>
            <Text style={styles.sub}>
              {certificate.referenceNo} issued to {certificate.recipientName} will be marked as revoked. This cannot be undone.
            </Text>
            <Text style={styles.label}>Reason *</Text>
            <TextInput
              value={reason}
              onChangeText={(t) => { setReason(t); if (error) setError(''); }}
              placeholder="Why is this certificate being revoked?"
              placeholderTextColor={colors.textHint}
              multiline
              style={[styles.input, !!error && styles.inputErr]}
            />
            {error ? <Text style={styles.err}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.confirm]} onPress={submit}>
                <Text style={styles.confirmText}>Revoke</Text>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  input: {
    height: 96, paddingHorizontal: 12, paddingTop: 12, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  confirm: { backgroundColor: colors.danger },
  confirmText: { fontFamily: fonts.bodySemi, color: colors.white },
});
