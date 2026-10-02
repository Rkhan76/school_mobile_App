import { useEffect, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';

type Props = { onSend: (text: string) => void };

export function ChatInput({ onSend }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [kbVisible, setKbVisible] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(showEvt, () => setKbVisible(true));
    const b = Keyboard.addListener(hideEvt, () => setKbVisible(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  const canSend = text.trim().length > 0;
  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  return (
    <View style={[styles.bar, { paddingBottom: kbVisible ? 8 : insets.bottom + 8 }]}>
      <Pressable
        style={styles.attach}
        onPress={() => Alert.alert('Attachments', 'Attachments are coming soon.')}
        accessibilityLabel="Attach file"
      >
        <Ionicons name="attach" size={24} color={colors.textSecondary} />
      </Pressable>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write message"
        placeholderTextColor={colors.textHint}
        multiline
        style={styles.input}
      />
      <Pressable
        style={[styles.send, !canSend && styles.sendDisabled]}
        onPress={submit}
        disabled={!canSend}
        accessibilityLabel="Send message"
      >
        <Ionicons name="send" size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 8,
    backgroundColor: colors.cardSolid, borderTopWidth: 1, borderTopColor: colors.border,
  },
  attach: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11,
    borderRadius: 22, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
    fontFamily: fonts.body, fontSize: 14.5, color: colors.text,
  },
  send: {
    width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: { opacity: 0.4 },
});
