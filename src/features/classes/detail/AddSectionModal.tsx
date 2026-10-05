import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../../theme/tokens';

type Props = {
  visible: boolean;
  initialName?: string;
  title?: string;
  confirmLabel?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

/** Small modal asking for a section name (used for Add and Edit). */
export function SectionNameModal({ visible, initialName = '', title = 'Add Section', confirmLabel = 'Add', onClose, onSubmit }: Props) {
  const [name, setName] = useState(initialName);
  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);
  const valid = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Section name (e.g. Section C)"
            placeholderTextColor={colors.textHint}
            style={styles.input}
            autoFocus
            maxLength={30}
          />
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.ok, !valid && { opacity: 0.5 }]}
              disabled={!valid}
              onPress={() => onSubmit(name.trim())}
            >
              <Text style={styles.okText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 14 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  input: { height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primaryDeep },
  ok: { backgroundColor: colors.primaryDeep },
  okText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
}));
