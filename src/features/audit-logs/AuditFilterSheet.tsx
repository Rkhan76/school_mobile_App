import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { EMPTY_FILTERS, PAGE_SIZES, parseDMY, type AuditFilters } from './mockAuditLogs';

type Props = { visible: boolean; filters: AuditFilters; onClose: () => void; onApply: (f: AuditFilters) => void };

type Errors = { from?: string; to?: string; range?: string };

function validate(f: AuditFilters): Errors {
  const e: Errors = {};
  const from = f.from.trim() ? parseDMY(f.from) : null;
  const to = f.to.trim() ? parseDMY(f.to) : null;
  if (f.from.trim() && from === null) e.from = 'Use DD/MM/YYYY';
  if (f.to.trim() && to === null) e.to = 'Use DD/MM/YYYY';
  if (from !== null && to !== null && from > to) e.range = 'From date must be on or before To date';
  return e;
}

export function AuditFilterSheet({ visible, filters, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<AuditFilters>(filters);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) { setDraft(filters); setErrors({}); }
  }, [visible, filters]);

  const set = <K extends keyof AuditFilters>(k: K, v: AuditFilters[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const apply = () => {
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length === 0) onApply({ ...draft, from: draft.from.trim(), to: draft.to.trim() });
  };

  const field = (label: string, key: 'entityType' | 'action' | 'userId', placeholder: string) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={draft[key]}
        onChangeText={(v) => set(key, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  const dateField = (label: string, key: 'from' | 'to', err?: string) => (
    <View style={[styles.field, styles.half]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={draft[key]}
        onChangeText={(v) => set(key, v)}
        placeholder="DD/MM/YYYY"
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
          <Text style={styles.title}>Filter audit logs</Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {field('Entity type', 'entityType', 'e.g. StudentEntity')}
            {field('Action', 'action', 'e.g. fee.payment.created')}
            {field('User ID', 'userId', 'e.g. USR-001')}
            <View style={styles.dates}>
              {dateField('From date', 'from', errors.from)}
              {dateField('To date', 'to', errors.to)}
            </View>
            {errors.range ? <Text style={styles.err}>{errors.range}</Text> : null}
            <View style={styles.field}>
              <Text style={styles.label}>Rows per page</Text>
              <View style={styles.seg}>
                {PAGE_SIZES.map((n) => {
                  const on = draft.pageSize === n;
                  return (
                    <Pressable key={n} style={[styles.segBtn, on && styles.segOn]} onPress={() => set('pageSize', n)}>
                      <Text style={[styles.segText, on && styles.segTextOn]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
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

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, gap: 12, maxHeight: '88%' },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  body: { gap: 12, paddingBottom: 4 },
  field: { gap: 6 },
  half: { flex: 1 },
  dates: { flexDirection: 'row', gap: 12 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  input: { height: 46, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.mintSoft, fontFamily: fonts.body, fontSize: 14, color: colors.text },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  seg: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid },
  segOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textSecondary },
  segTextOn: { color: colors.white },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white },
});
