import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { colors, fonts, radius } from '../../theme/tokens';
import { ME_ID, PEOPLE, type NewGroupInput } from './mockMessages';

type Props = { visible: boolean; onSubmit: (input: NewGroupInput) => void; onClose: () => void };

export function NewGroupModal({ visible, onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; members?: string }>({});

  useEffect(() => {
    if (visible) {
      setName('');
      setDescription('');
      setSelected([]);
      setErrors({});
    }
  }, [visible]);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const submit = () => {
    const e: { name?: string; members?: string } = {};
    if (name.trim().length < 2) e.name = 'Group name must be at least 2 characters.';
    if (selected.length === 0) e.members = 'Pick at least one member.';
    setErrors(e);
    if (Object.keys(e).length === 0) {
      onSubmit({ name: name.trim(), description: description.trim(), memberIds: selected });
    }
  };

  const people = PEOPLE.filter((p) => p.id !== ME_ID);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grab} />
          <Text style={styles.title}>New group</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Text style={styles.label}>Group name</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="e.g. Science Fair Team"
              placeholderTextColor={colors.textHint} style={[styles.input, !!errors.name && styles.inputErr]}
            />
            {errors.name ? <Text style={styles.err}>{errors.name}</Text> : null}

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description} onChangeText={setDescription} placeholder="Optional" multiline
              placeholderTextColor={colors.textHint} style={[styles.input, styles.multi]}
            />

            <Text style={styles.label}>Members ({selected.length} selected)</Text>
            {people.map((p) => {
              const on = selected.includes(p.id);
              return (
                <Pressable key={p.id} style={styles.person} onPress={() => toggle(p.id)}>
                  <Avatar name={p.name} size={36} />
                  <View style={styles.personBody}>
                    <Text style={styles.personName}>{p.name}</Text>
                    <Text style={styles.personRole}>{p.role}</Text>
                  </View>
                  <Ionicons
                    name={on ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={on ? colors.primary : colors.textHint}
                  />
                </Pressable>
              );
            })}
            {errors.members ? <Text style={styles.err}>{errors.members}</Text> : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={submit}>
              <Text style={styles.saveText}>Create group</Text>
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
    padding: 20, gap: 10, maxHeight: '88%',
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  form: { gap: 6, paddingBottom: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  multi: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  personBody: { flex: 1 },
  personName: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  personRole: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
