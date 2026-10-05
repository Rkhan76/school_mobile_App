import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { PAGE_SIZES, inputToIso } from './types';
import { EMPTY_FILTERS, type Filters } from './parts';

type Option = { value: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  filters: Filters;
  typeOptions: Option[];
  categoryOptions: Option[];
  onClose: () => void;
  onApply: (f: Filters) => void;
};

type Errors = { from?: string; to?: string; range?: string };

function validate(f: Filters): Errors {
  const e: Errors = {};
  const from = f.from.trim() ? inputToIso(f.from) : null;
  const to = f.to.trim() ? inputToIso(f.to) : null;
  if (f.from.trim() && !from) e.from = 'Use DD/MM/YYYY';
  if (f.to.trim() && !to) e.to = 'Use DD/MM/YYYY';
  if (from && to && from > to) e.range = 'From date must be on or before To date';
  return e;
}

export function FilterSheet({ visible, title, filters, typeOptions, categoryOptions, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Filters>(filters);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) { setDraft(filters); setErrors({}); }
  }, [visible, filters]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const apply = () => {
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length === 0) onApply({ ...draft, from: draft.from.trim(), to: draft.to.trim() });
  };

  const dateField = (label: string, key: 'from' | 'to', err?: string) => (
    <View style={styles.half}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={draft[key]}
        onChangeText={(v) => set(key, v)}
        placeholder="dd/mm/yyyy"
        placeholderTextColor={colors.textHint}
        style={[styles.input, (err || errors.range) ? styles.inputErr : null]}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grab} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.wrap}>
              {typeOptions.map((o) => {
                const on = draft.entryType === o.value;
                return (
                  <Pressable key={o.label} style={[styles.pill, on && styles.pillOn]} onPress={() => set('entryType', o.value)}>
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.wrap}>
              {categoryOptions.map((o) => {
                const on = draft.category === o.value;
                return (
                  <Pressable key={o.value || 'all'} style={[styles.pill, on && styles.pillOn]} onPress={() => set('category', o.value)}>
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dates}>
              {dateField('From date', 'from', errors.from)}
              {dateField('To date', 'to', errors.to)}
            </View>
            {errors.range ? <Text style={styles.err}>{errors.range}</Text> : null}

            <Text style={styles.label}>Rows per page</Text>
            <View style={styles.segRow}>
              {PAGE_SIZES.map((n) => {
                const on = draft.pageSize === n;
                return (
                  <Pressable key={n} style={[styles.segBtn, on && styles.pillOn]} onPress={() => set('pageSize', n)}>
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.reset]}
              onPress={() => { setDraft(EMPTY_FILTERS); setErrors({}); onApply(EMPTY_FILTERS); }}
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.apply]} onPress={apply}>
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, gap: 12, maxHeight: '88%' },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  body: { gap: 8, paddingBottom: 4 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { height: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  pillTextOn: { color: colors.white },
  dates: { flexDirection: 'row', gap: 12, marginTop: 4 },
  half: { flex: 1, gap: 6 },
  input: { height: 46, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.mintSoft, fontFamily: fonts.body, fontSize: 14, color: colors.text },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white },
}));
