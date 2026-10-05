import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import {
  CASHBOOK_CATEGORY_OPTIONS, ENTRY_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS, inputToIso, isoToInput, todayIso,
  type CashbookCategory, type CreateCashbookInput, type EntryType, type PaymentMethod,
} from './types';

type Props = {
  visible: boolean;
  onSubmit: (input: CreateCashbookInput) => void;
  onClose: () => void;
  isSaving?: boolean;
};

type Errors = Partial<Record<'date' | 'description' | 'counterpartyName' | 'amount', string>>;

const TYPE_CHOICES = ENTRY_TYPE_OPTIONS.filter((o) => o.value !== '') as { value: EntryType; label: string }[];
const CATEGORY_CHOICES = CASHBOOK_CATEGORY_OPTIONS.filter((o) => o.value !== '') as { value: CashbookCategory; label: string }[];

/** Create-only — there's no PATCH/edit endpoint for cashbook entries (create/read/delete only). */
export function CashbookFormModal({ visible, onSubmit, onClose, isSaving }: Props) {
  const insets = useSafeAreaInsets();
  const [entryType, setEntryType] = useState<EntryType>('CREDIT');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<CashbookCategory>('OTHER');
  const [description, setDescription] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyContact, setCounterpartyContact] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setEntryType('CREDIT');
      setDate(isoToInput(todayIso()));
      setCategory('OTHER');
      setDescription('');
      setCounterpartyName('');
      setCounterpartyContact('');
      setMethod('CASH');
      setAmount('');
      setNotes('');
      setErrors({});
    }
  }, [visible]);

  const submit = () => {
    const e: Errors = {};
    let isoDate: string | undefined;
    if (date.trim()) {
      const iso = inputToIso(date);
      if (!iso) e.date = 'Enter a valid date as DD/MM/YYYY.';
      else isoDate = iso;
    }
    if (!description.trim()) e.description = 'Description is required.';
    if (!counterpartyName.trim()) e.counterpartyName = 'Counterparty name is required.';
    const amt = Number(amount.replace(/,/g, ''));
    if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) e.amount = 'Enter an amount greater than 0.';
    setErrors(e);
    if (Object.keys(e).length === 0) {
      onSubmit({
        entryType,
        category,
        description: description.trim(),
        amount: Math.round(amt * 100) / 100,
        entryDate: isoDate,
        paymentMethod: method,
        counterpartyName: counterpartyName.trim(),
        counterpartyContact: counterpartyContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
  };

  const Chip = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
    <Pressable style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close form">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>Add cashbook entry</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {TYPE_CHOICES.map((t) => (
              <Chip key={t.value} on={entryType === t.value} label={t.label} onPress={() => setEntryType(t.value)} />
            ))}
          </View>

          <Text style={styles.label}>Date</Text>
          <TextInput
            value={date} onChangeText={setDate} placeholder="dd/mm/yyyy (defaults to today)" placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" maxLength={10} style={[styles.input, !!errors.date && styles.inputErr]}
          />
          {errors.date ? <Text style={styles.err}>{errors.date}</Text> : null}

          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {CATEGORY_CHOICES.map((c) => (
              <Chip key={c.value} on={category === c.value} label={c.label} onPress={() => setCategory(c.value)} />
            ))}
          </View>

          <Text style={styles.label}>Description *</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="What is this entry for?" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.description && styles.inputErr]}
          />
          {errors.description ? <Text style={styles.err}>{errors.description}</Text> : null}

          <Text style={styles.label}>Counterparty name *</Text>
          <TextInput
            value={counterpartyName} onChangeText={setCounterpartyName} placeholder="Paid to / received from" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.counterpartyName && styles.inputErr]}
          />
          {errors.counterpartyName ? <Text style={styles.err}>{errors.counterpartyName}</Text> : null}

          <Text style={styles.label}>Counterparty contact</Text>
          <TextInput
            value={counterpartyContact} onChangeText={setCounterpartyContact} placeholder="Phone / email (optional)" placeholderTextColor={colors.textHint}
            style={styles.input}
          />

          <Text style={styles.label}>Method *</Text>
          <View style={styles.chips}>
            {PAYMENT_METHOD_OPTIONS.map((m) => (
              <Chip key={m.value} on={method === m.value} label={m.label} onPress={() => setMethod(m.value)} />
            ))}
          </View>

          <Text style={styles.label}>Amount (INR) *</Text>
          <TextInput
            value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.textHint}
            keyboardType="decimal-pad" style={[styles.input, !!errors.amount && styles.inputErr]}
          />
          {errors.amount ? <Text style={styles.err}>{errors.amount}</Text> : null}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor={colors.textHint}
            style={styles.input}
          />
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={isSaving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save, isSaving && styles.saveDisabled]} onPress={submit} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Add entry</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
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
  actions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid,
  },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveDisabled: { opacity: 0.7 },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
}));
