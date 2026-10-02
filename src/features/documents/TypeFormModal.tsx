import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { Chip } from './parts';
import { ENTITY_LABELS, ENTITY_TYPES, type DocumentType, type DocumentTypeInput, type EntityType } from './types';

type Props = {
  visible: boolean;
  /** null = add mode */
  type: DocumentType | null;
  existingNames: string[];
  onSubmit: (input: DocumentTypeInput) => void;
  onClose: () => void;
};

export function TypeFormModal({ visible, type, existingNames, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [expiry, setExpiry] = useState(false);
  const [appliesTo, setAppliesTo] = useState<EntityType>('STUDENT');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (visible) {
      setName(type?.name ?? '');
      setDescription(type?.description ?? '');
      setMandatory(type?.isMandatory ?? false);
      setExpiry(type?.hasExpiry ?? false);
      setAppliesTo(type?.appliesTo ?? 'STUDENT');
      setErrors({});
    }
  }, [visible, type]);

  const submit = () => {
    const e: { name?: string } = {};
    const trimmed = name.trim();
    if (!trimmed) e.name = 'Name is required.';
    else if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase() && n !== type?.name)) {
      e.name = 'A document type with this name already exists.';
    }
    setErrors(e);
    if (Object.keys(e).length === 0) {
      onSubmit({
        name: trimmed,
        description: description.trim() || undefined,
        appliesTo,
        isMandatory: mandatory,
        hasExpiry: expiry,
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close form">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>{type ? 'Edit document type' : 'Add document type'}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            value={name} onChangeText={setName} placeholder="e.g. Aadhaar Card" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.name && { borderColor: colors.danger }]}
          />
          {errors.name ? <Text style={styles.err}>{errors.name}</Text> : null}

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="Optional" placeholderTextColor={colors.textHint}
            style={styles.input}
          />

          <Text style={styles.label}>Applies to *</Text>
          <View style={styles.wrap}>
            {ENTITY_TYPES.map((r) => (
              <Chip
                key={r} label={ENTITY_LABELS[r]} on={appliesTo === r}
                onPress={() => { if (!type) setAppliesTo(r); }}
              />
            ))}
          </View>
          {type ? <Text style={styles.hint}>Can't be changed after creation.</Text> : null}

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Mandatory</Text>
              <Text style={styles.switchSub}>Must be submitted by everyone it applies to.</Text>
            </View>
            <Switch value={mandatory} onValueChange={setMandatory} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} />
          </View>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Expiry required</Text>
              <Text style={styles.switchSub}>Track an expiry date for this document.</Text>
            </View>
            <Switch value={expiry} onValueChange={setExpiry} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} />
          </View>
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit}>
            <Text style={styles.saveText}>{type ? 'Save changes' : 'Add type'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  form: { paddingHorizontal: 16, paddingBottom: 16, gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint, marginTop: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14,
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  switchTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  switchSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  actions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid,
  },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
