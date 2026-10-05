import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { Button, Checkbox, OptionSheet, PickerField, TextField, form } from './parts';
import {
  STUDENTS, collectPayment, formatDate, formatINR, isOverdue, statusTone, usePendingInvoices,
  type PaymentMode, type Receipt,
} from './mockFees';

const MODES: PaymentMode[] = ['Cash', 'Online', 'Cheque'];

type Props = {
  visible: boolean;
  initialStudentId?: string | null;
  initialInvoiceId?: string | null;
  onClose: () => void;
  onDone: (r: Receipt) => void;
};

export function CollectPaymentModal({ visible, initialStudentId, initialInvoiceId, onClose, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentOpen, setStudentOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [amountText, setAmountText] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Cash');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<{ student?: string; invoices?: string; amount?: string; reference?: string }>({});

  const pending = usePendingInvoices(studentId);

  useEffect(() => {
    if (visible) {
      setStudentId(initialStudentId ?? null);
      setSelected(initialInvoiceId ? [initialInvoiceId] : []);
      setMode('Cash');
      setReference('');
      setErrors({});
    }
  }, [visible, initialStudentId, initialInvoiceId]);

  const selectedDue = useMemo(
    () => pending.filter((p) => selected.includes(p.id)).reduce((a, b) => a + b.outstanding, 0),
    [pending, selected],
  );

  // keep the amount in sync with the selection (user can then lower it)
  useEffect(() => {
    setAmountText(selectedDue > 0 ? String(selectedDue) : '');
  }, [selectedDue]);

  const student = STUDENTS.find((s) => s.id === studentId) ?? null;

  const toggle = (id: string) => {
    setErrors((e) => ({ ...e, invoices: undefined }));
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const submit = () => {
    const e: typeof errors = {};
    const amount = Number(amountText);
    if (!studentId) e.student = 'Select a student.';
    else if (selected.length === 0) e.invoices = 'Select at least one invoice.';
    if (selected.length > 0) {
      if (!amountText.trim() || !Number.isFinite(amount) || amount <= 0) e.amount = 'Enter a valid amount.';
      else if (amount > selectedDue) e.amount = `Cannot exceed outstanding ${formatINR(selectedDue)}.`;
    }
    if (mode !== 'Cash' && !reference.trim()) e.reference = 'Reference number is required.';
    setErrors(e);
    if (Object.keys(e).length > 0 || !studentId) return;
    const res = collectPayment({ studentId, invoiceIds: selected, amount, mode, reference });
    if (res.ok) onDone(res.receipt);
    else setErrors({ amount: res.error });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Collect Payment</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <PickerField
            label="Student"
            value={student ? `${student.name} (${student.className})` : null}
            placeholder="Select student..."
            error={errors.student}
            onPress={() => setStudentOpen(true)}
          />

          {student ? (
            <View style={{ gap: 8 }}>
              <Text style={form.label}>Pending invoices</Text>
              {pending.length === 0 ? (
                <View style={styles.allPaid}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.allPaidText}>No pending invoices for this student.</Text>
                </View>
              ) : (
                pending.map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <Pressable key={p.id} onPress={() => toggle(p.id)} style={[styles.inv, on && styles.invOn]}>
                      <Checkbox checked={on} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={styles.invTop}>
                          <Text style={styles.invNo}>{p.invoiceNo}</Text>
                          <Badge label={p.status} tone={statusTone(p.status)} />
                        </View>
                        <Text style={styles.invSub}>
                          {p.period} · Due{' '}
                          <Text style={isOverdue(p) ? { color: colors.danger, fontFamily: fonts.bodySemi } : undefined}>
                            {formatDate(p.dueDate)}
                          </Text>
                        </Text>
                        <Text style={styles.invHeads} numberOfLines={2}>
                          {p.items.map((it) => `${it.name} ${formatINR(it.amount)}`).join(' · ')}
                        </Text>
                        <Text style={styles.invOut}>Outstanding {formatINR(p.outstanding)}</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
              {errors.invoices ? <Text style={form.err}>{errors.invoices}</Text> : null}
            </View>
          ) : null}

          {selected.length > 0 ? (
            <>
              <TextField
                label={`Amount (max ${formatINR(selectedDue)})`} value={amountText} placeholder="0"
                keyboardType="number-pad" error={errors.amount}
                onChangeText={(t) => { setErrors((e) => ({ ...e, amount: undefined })); setAmountText(t.replace(/[^0-9]/g, '')); }}
              />
              <View style={{ gap: 6 }}>
                <Text style={form.label}>Payment mode</Text>
                <View style={styles.modes}>
                  {MODES.map((m) => {
                    const on = mode === m;
                    return (
                      <Pressable key={m} onPress={() => { setMode(m); setErrors((e) => ({ ...e, reference: undefined })); }} style={[styles.mode, on && styles.modeOn]}>
                        <Text style={[styles.modeText, on && { color: colors.white }]}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {mode !== 'Cash' ? (
                <TextField
                  label={mode === 'Cheque' ? 'Cheque number' : 'Transaction / reference no.'}
                  value={reference} mono autoCapitalize="characters" autoCorrect={false}
                  placeholder={mode === 'Cheque' ? 'e.g. CHQ100245' : 'e.g. UPI48201234'}
                  error={errors.reference}
                  onChangeText={(t) => { setErrors((e) => ({ ...e, reference: undefined })); setReference(t); }}
                />
              ) : null}
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button label="Cancel" variant="soft" flex onPress={onClose} />
          <Button label="Collect payment" icon="card-outline" flex onPress={submit} />
        </View>

        <OptionSheet
          visible={studentOpen} title="Select student" searchable value={studentId ?? ''}
          options={STUDENTS.map((s) => ({ value: s.id, label: s.name, sub: `${s.className} · Roll ${s.rollNo}` }))}
          onClose={() => setStudentOpen(false)}
          onSelect={(v) => {
            setStudentOpen(false);
            if (v && v !== studentId) {
              setStudentId(v);
              setSelected([]);
              setErrors({});
            }
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  body: { padding: 16, gap: 14 },
  allPaid: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.lg, backgroundColor: colors.successBg },
  allPaidText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.success },
  inv: {
    flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border,
  },
  invOn: { borderColor: colors.primary, backgroundColor: colors.mintSoft },
  invTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invNo: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.primaryDeep },
  invSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  invHeads: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  invOut: { fontFamily: fonts.heading, fontSize: 14, color: colors.danger },
  modes: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  modeOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  modeText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid },
}));
