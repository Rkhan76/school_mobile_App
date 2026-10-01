import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import {
  CASH_CATEGORIES, PAY_METHODS, TODAY_ISO, inputToIso, isoToInput,
  type CashType, type CashbookEntry, type CashbookInput, type PayMethod,
} from './mockLedgers';

type Props = {
  visible: boolean;
  /** null = add mode */
  entry: CashbookEntry | null;
  onSubmit: (input: CashbookInput) => void;
  onClose: () => void;
};

type Errors = Partial<Record<'date' | 'category' | 'description' | 'amount', string>>;

export function CashbookFormModal({ visible, entry, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<CashType>('IN');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [method, setMethod] = useState<PayMethod>('Cash');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setType(entry?.type ?? 'IN');
      setDate(isoToInput(entry?.date ?? TODAY_ISO));
      setCategory(entry?.category ?? '');
      setDescription(entry?.description ?? '');
      setCounterparty(entry?.counterparty ?? '');
      setMethod(entry?.method ?? 'Cash');
      setAmount(entry ? String(entry.amount) : '');
      setErrors({});
    }
  }, [visible, entry]);

  const submit = () => {
    const e: Errors = {};
    const iso = inputToIso(date);
    if (!iso) e.date = 'Enter a valid date as DD/MM/YYYY.';
    if (!category) e.category = 'Select a category.';
    if (!description.trim()) e.description = 'Description is required.';
    const amt = Number(amount.replace(/,/g, ''));
    if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) e.amount = 'Enter an amount greater than 0.';
    setErrors(e);
    if (Object.keys(e).length === 0 && iso) {
      onSubmit({
        type, date: iso, category, description: description.trim(),
        counterparty: counterparty.trim(), method, amount: Math.round(amt * 100) / 100,
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
          <Text style={styles.heading}>{entry ? 'Edit cashbook entry' : 'Add cashbook entry'}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            <Chip on={type === 'IN'} label="IN (Credit)" onPress={() => setType('IN')} />
            <Chip on={type === 'OUT'} label="OUT (Debit)" onPress={() => setType('OUT')} />
          </View>

          <Text style={styles.label}>Date *</Text>
          <TextInput
            value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" maxLength={10} style={[styles.input, !!errors.date && styles.inputErr]}
          />
          {errors.date ? <Text style={styles.err}>{errors.date}</Text> : null}

          <Text style={styles.label}>Category *</Text>
          <View style={styles.chips}>
            {CASH_CATEGORIES.map((c) => <Chip key={c} on={category === c} label={c} onPress={() => setCategory(c)} />)}
          </View>
          {errors.category ? <Text style={styles.err}>{errors.category}</Text> : null}

          <Text style={styles.label}>Description *</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="What is this entry for?" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.description && styles.inputErr]}
          />
          {errors.description ? <Text style={styles.err}>{errors.description}</Text> : null}

          <Text style={styles.label}>Counterparty</Text>
          <TextInput
            value={counterparty} onChangeText={setCounterparty} placeholder="Paid to / received from" placeholderTextColor={colors.textHint}
            style={styles.input}
          />

          <Text style={styles.label}>Method</Text>
          <View style={styles.chips}>
            {PAY_METHODS.map((m) => <Chip key={m} on={method === m} label={m} onPress={() => setMethod(m)} />)}
          </View>

          <Text style={styles.label}>Amount (INR) *</Text>
          <TextInput
            value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.textHint}
            keyboardType="decimal-pad" style={[styles.input, !!errors.amount && styles.inputErr]}
          />
          {errors.amount ? <Text style={styles.err}>{errors.amount}</Text> : null}
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit}>
            <Text style={styles.saveText}>{entry ? 'Save changes' : 'Add entry'}</Text>
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
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
