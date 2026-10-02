import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import { Button, OptionSheet, PickerField, form } from './parts';
import {
  CLASSES, formatINR, type FeeStructure, type FeeType, type StructureInput,
} from './mockFees';

type HeadDraft = { key: number; feeTypeId: string; amount: string };

type Props = {
  visible: boolean;
  /** null = add mode */
  structure: FeeStructure | null;
  structures: FeeStructure[];
  feeTypes: FeeType[];
  onSubmit: (input: StructureInput) => void;
  onClose: () => void;
};

let keySeq = 0;
const newKey = () => { keySeq += 1; return keySeq; };

export function StructureFormModal({ visible, structure, structures, feeTypes, onSubmit, onClose }: Props) {
  const [classId, setClassId] = useState('');
  const [heads, setHeads] = useState<HeadDraft[]>([]);
  const [classOpen, setClassOpen] = useState(false);
  const [typeFor, setTypeFor] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ classId?: string; heads?: string }>({});

  useEffect(() => {
    if (visible) {
      setClassId(structure?.classId ?? '');
      setHeads(structure
        ? structure.heads.map((h) => ({ key: newKey(), feeTypeId: h.feeTypeId, amount: String(h.amount) }))
        : [{ key: newKey(), feeTypeId: '', amount: '' }]);
      setErrors({});
    }
  }, [visible, structure]);

  const takenClassIds = structures.filter((s) => s.id !== structure?.id).map((s) => s.classId);
  const classOptions = CLASSES.filter((c) => !takenClassIds.includes(c.id)).map((c) => ({ value: c.id, label: c.name }));
  const className = CLASSES.find((c) => c.id === classId)?.name ?? null;
  const total = heads.reduce((a, h) => a + (Number(h.amount) || 0), 0);

  const patch = (key: number, p: Partial<HeadDraft>) => {
    setErrors((e) => ({ ...e, heads: undefined }));
    setHeads((hs) => hs.map((h) => (h.key === key ? { ...h, ...p } : h)));
  };

  const submit = () => {
    const e: typeof errors = {};
    if (!classId) e.classId = 'Select a class.';
    else if (takenClassIds.includes(classId)) e.classId = 'This class already has a fee structure.';
    if (heads.length === 0) e.heads = 'Add at least one fee head.';
    else if (heads.some((h) => !h.feeTypeId)) e.heads = 'Choose a fee type for every head.';
    else if (new Set(heads.map((h) => h.feeTypeId)).size !== heads.length) e.heads = 'Each fee type can be used only once.';
    else if (heads.some((h) => !(Number(h.amount) > 0))) e.heads = 'Every amount must be greater than 0.';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ classId, heads: heads.map((h) => ({ feeTypeId: h.feeTypeId, amount: Number(h.amount) })) });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.box}>
          <Text style={styles.title}>{structure ? 'Edit fee structure' : 'Add fee structure'}</Text>
          <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
            <PickerField label="Class" value={className} placeholder="Select class..." error={errors.classId} onPress={() => setClassOpen(true)} />
            <Text style={form.label}>Fee heads</Text>
            {heads.map((h) => (
              <View key={h.key} style={styles.head}>
                <Pressable style={[form.input, form.pick, { flex: 1.4 }]} onPress={() => setTypeFor(h.key)}>
                  <Text style={[form.pickText, !h.feeTypeId && { color: colors.textHint, fontFamily: fonts.body }]} numberOfLines={1}>
                    {feeTypes.find((t) => t.id === h.feeTypeId)?.name ?? 'Fee type'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textHint} />
                </Pressable>
                <TextInput
                  value={h.amount} onChangeText={(t) => patch(h.key, { amount: t.replace(/[^0-9]/g, '') })}
                  placeholder="Amount" placeholderTextColor={colors.textHint} keyboardType="number-pad"
                  style={[form.input, { flex: 1 }]}
                />
                <Pressable onPress={() => setHeads((hs) => hs.filter((x) => x.key !== h.key))} hitSlop={8} accessibilityLabel="Remove head">
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            ))}
            {errors.heads ? <Text style={form.err}>{errors.heads}</Text> : null}
            <Pressable
              style={styles.add}
              onPress={() => setHeads((hs) => [...hs, { key: newKey(), feeTypeId: '', amount: '' }])}
            >
              <Ionicons name="add" size={18} color={colors.primaryDeep} />
              <Text style={styles.addText}>Add fee head</Text>
            </Pressable>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatINR(total)}</Text>
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Button label="Cancel" variant="soft" flex onPress={onClose} />
            <Button label={structure ? 'Save changes' : 'Add structure'} flex onPress={submit} />
          </View>
        </View>

        <OptionSheet
          visible={classOpen} title="Select class" options={classOptions} value={classId}
          onClose={() => setClassOpen(false)}
          onSelect={(v) => { setClassId(v); setErrors((e) => ({ ...e, classId: undefined })); setClassOpen(false); }}
        />
        <OptionSheet
          visible={typeFor !== null} title="Select fee type"
          options={feeTypes.map((t) => ({ value: t.id, label: t.name }))}
          value={heads.find((h) => h.key === typeFor)?.feeTypeId ?? ''}
          onClose={() => setTypeFor(null)}
          onSelect={(v) => { if (typeFor !== null) patch(typeFor, { feeTypeId: v }); setTypeFor(null); }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 12, maxHeight: '90%' },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 42, borderRadius: radius.md, backgroundColor: colors.mint },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  totalValue: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.primaryDeep },
  actions: { flexDirection: 'row', gap: 10 },
});
