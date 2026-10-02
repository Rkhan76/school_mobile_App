import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { colors, fonts, radius } from '../../theme/tokens';
import {
  CERTIFICATE_KINDS, KIND_DEFAULT_TITLE, KIND_LABEL, RECIPIENTS, TODAY_ISO, inputToIso, isoToInput,
  type CertificateKind, type IssueInput, type Recipient,
} from './mockCertificates';

type Props = { visible: boolean; onSubmit: (input: IssueInput) => void; onClose: () => void };
type Errors = Partial<Record<'recipient' | 'title' | 'issueDate', string>>;

export function IssueModal({ visible, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<CertificateKind>('Bonafide');
  const [recipientKind, setRecipientKind] = useState<'Student' | 'Staff'>('Student');
  const [query, setQuery] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [title, setTitle] = useState(KIND_DEFAULT_TITLE.Bonafide);
  const [date, setDate] = useState(isoToInput(TODAY_ISO));
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setKind('Bonafide');
      setRecipientKind('Student');
      setQuery('');
      setRecipient(null);
      setTitle(KIND_DEFAULT_TITLE.Bonafide);
      setDate(isoToInput(TODAY_ISO));
      setRemarks('');
      setErrors({});
    }
  }, [visible]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RECIPIENTS.filter((r) => r.kind === recipientKind && (!q || r.name.toLowerCase().includes(q)));
  }, [query, recipientKind]);

  const pickKind = (k: CertificateKind) => {
    setKind(k);
    setTitle(KIND_DEFAULT_TITLE[k]);
  };

  const pickRecipientKind = (k: 'Student' | 'Staff') => {
    setRecipientKind(k);
    setRecipient(null);
    setQuery('');
  };

  const submit = () => {
    const e: Errors = {};
    if (!recipient) e.recipient = 'Select a recipient.';
    if (!title.trim()) e.title = 'Title is required.';
    const iso = inputToIso(date);
    if (!iso) e.issueDate = 'Enter a valid date as DD/MM/YYYY.';
    setErrors(e);
    if (Object.keys(e).length === 0 && recipient && iso) {
      onSubmit({
        type: kind, recipientName: recipient.name, recipientType: recipient.recipientType,
        title: title.trim(), issueDate: iso, remarks: remarks.trim() || undefined,
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
          <Text style={styles.heading}>Issue certificate</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Certificate type</Text>
          <View style={styles.chips}>
            {CERTIFICATE_KINDS.map((k) => {
              const on = k === kind;
              return (
                <Pressable key={k} onPress={() => pickKind(k)} style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{KIND_LABEL[k]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Recipient *</Text>
          <View style={styles.segment}>
            {(['Student', 'Staff'] as const).map((k) => {
              const on = k === recipientKind;
              return (
                <Pressable key={k} onPress={() => pickRecipientKind(k)} style={[styles.segBtn, on && styles.segOn]}>
                  <Text style={[styles.segText, on && styles.segTextOn]}>{k}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.searchField}>
            <Ionicons name="search-outline" size={18} color={colors.textHint} />
            <TextInput
              value={query} onChangeText={setQuery} placeholder={`Search ${recipientKind.toLowerCase()}s...`}
              placeholderTextColor={colors.textHint} style={styles.searchInput} autoCorrect={false}
            />
          </View>
          <View style={[styles.list, !!errors.recipient && styles.inputErr]}>
            {matches.length === 0 ? (
              <Text style={styles.none}>No matches found.</Text>
            ) : (
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {matches.map((r) => {
                  const on = recipient?.id === r.id;
                  return (
                    <Pressable key={r.id} onPress={() => setRecipient(r)} style={[styles.row, on && styles.rowOn]}>
                      <Avatar name={r.name} size={32} />
                      <View style={styles.rowText}>
                        <Text style={styles.rowName}>{r.name}</Text>
                        <Text style={styles.rowSub}>{r.detail}</Text>
                      </View>
                      {on && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
          {errors.recipient ? <Text style={styles.err}>{errors.recipient}</Text> : null}

          <Text style={styles.label}>Title *</Text>
          <TextInput
            value={title} onChangeText={setTitle} placeholder="Certificate title" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.title && styles.inputErr]}
          />
          {errors.title ? <Text style={styles.err}>{errors.title}</Text> : null}

          <Text style={styles.label}>Issue date</Text>
          <TextInput
            value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.issueDate && styles.inputErr]}
          />
          {errors.issueDate ? <Text style={styles.err}>{errors.issueDate}</Text> : null}

          <Text style={styles.label}>Remarks (optional)</Text>
          <TextInput
            value={remarks} onChangeText={setRemarks} placeholder="Any additional notes" placeholderTextColor={colors.textHint}
            multiline style={[styles.input, styles.multi]}
          />
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit}>
            <Text style={styles.saveText}>Issue certificate</Text>
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
  multi: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  segment: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: colors.mint },
  segBtn: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  segOn: { backgroundColor: colors.cardSolid },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  segTextOn: { color: colors.primaryDeep },
  searchField: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12,
    backgroundColor: colors.cardSolid, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, padding: 0 },
  list: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.cardSolid,
    maxHeight: 220, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  rowOn: { backgroundColor: colors.mintSoft },
  rowText: { flex: 1 },
  rowName: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  none: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, padding: 14, textAlign: 'center' },
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
