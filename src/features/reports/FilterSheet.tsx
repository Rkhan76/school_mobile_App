import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { DateInput } from '../../components/ui/DateInput';
import { getAcademicYearsMaster, getClassesMaster } from '../common/api';
import type { ClassWithSections } from '../common/types';
import {
  DEFAULT_FILTERS, type Granularity, type RangePreset, type ReportCapabilities, type ReportFilters,
} from './types';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'any', label: 'Any' }, { value: 'today', label: 'Today' }, { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' }, { value: 'year', label: 'This year' }, { value: 'custom', label: 'Custom' },
];
const GROUPS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year' },
];

const DATE_RE = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const isValidDate = (s: string): boolean => s === '' || DATE_RE.test(s);

/** Number of filters that differ from defaults (for the badge on the Filters button). */
export function activeFilterCount(f: ReportFilters, caps: ReportCapabilities): number {
  let n = 0;
  if (caps.dateRange && f.preset !== 'any') n++;
  if (caps.academicYear && f.academicYear) n++;
  if (caps.classFilter && f.classId) n++;
  if (caps.classFilter && caps.section && f.section) n++;
  if (caps.groupBy && f.groupBy !== DEFAULT_FILTERS.groupBy) n++;
  if (caps.compare && f.compare) n++;
  if (caps.threshold && f.minAmount) n++;
  return n;
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Chips<T extends string>({ options, value, onChange, disabled }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value || '__all'} disabled={disabled} onPress={() => onChange(o.value)} style={[styles.chip, on && styles.chipOn, disabled && { opacity: 0.45 }]}>
            <Text style={[styles.chipText, on && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type Props = {
  visible: boolean;
  caps: ReportCapabilities;
  value: ReportFilters;
  onApply: (f: ReportFilters) => void;
  onClose: () => void;
};

export function FilterSheet({ visible, caps, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<ReportFilters>(value);
  useEffect(() => { if (visible) setDraft(value); }, [visible, value]);
  const set = (p: Partial<ReportFilters>): void => setDraft((d) => ({ ...d, ...p }));

  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [years, setYears] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    if (!visible) return;
    getClassesMaster().then(setClasses).catch(() => setClasses([]));
    getAcademicYearsMaster().then(setYears).catch(() => setYears([]));
  }, [visible]);

  const sectionOptions = useMemo(
    () => classes.find((c) => c.id === draft.classId)?.sections ?? [],
    [classes, draft.classId],
  );

  const custom = draft.preset === 'custom';
  const datesOk = !custom || (isValidDate(draft.from) && isValidDate(draft.to));
  const noClass = !draft.classId;

  const reset = (): void => {
    setDraft(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Filters</Text>
          <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {caps.dateRange ? (
              <View style={styles.block}>
                <Label>Range</Label>
                <Chips options={PRESETS} value={draft.preset} onChange={(v) => set({ preset: v })} />
                {custom ? (
                  <View style={styles.dates}>
                    {(['from', 'to'] as const).map((k) => (
                      <View key={k} style={{ flex: 1 }}>
                        <Text style={styles.sub}>{k === 'from' ? 'From' : 'To'}</Text>
                        <DateInput
                          value={draft[k]} onChangeText={(t) => set({ [k]: t })} placeholder="dd/mm/yyyy"
                          style={[styles.input, !isValidDate(draft[k]) && { borderColor: colors.danger }]}
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
                {!datesOk ? <Text style={styles.err}>Use dd/mm/yyyy.</Text> : null}
              </View>
            ) : null}

            {caps.academicYear ? (
              <View style={styles.block}>
                <Label>Academic year</Label>
                <Chips options={[{ value: '', label: 'Any / default' }, ...years.map((y) => ({ value: y.id, label: y.label }))]} value={draft.academicYear} onChange={(v) => set({ academicYear: v })} />
              </View>
            ) : null}

            {caps.classFilter ? (
              <View style={styles.block}>
                <Label>Class</Label>
                <Chips options={[{ value: '', label: 'All classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} value={draft.classId} onChange={(v) => set({ classId: v, section: '' })} />
              </View>
            ) : null}

            {caps.classFilter && caps.section ? (
              <View style={styles.block}>
                <Label>Section</Label>
                <Chips options={[{ value: '', label: 'All sections' }, ...sectionOptions.map((s) => ({ value: s.id, label: s.name }))]} value={draft.section} onChange={(v) => set({ section: v })} disabled={noClass} />
                {noClass ? <Text style={styles.hint}>Pick a class to choose a section.</Text> : null}
              </View>
            ) : null}

            {caps.groupBy ? (
              <View style={styles.block}>
                <Label>Group by</Label>
                <View style={styles.seg}>
                  {GROUPS.map((g) => {
                    const on = g.value === draft.groupBy;
                    return (
                      <Pressable key={g.value} onPress={() => set({ groupBy: g.value })} style={[styles.segItem, on && styles.segOn]}>
                        <Text style={[styles.segText, on && { color: colors.white }]}>{g.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {caps.threshold ? (
              <View style={styles.block}>
                <Label>{caps.threshold}</Label>
                <TextInput
                  value={draft.minAmount} onChangeText={(t) => set({ minAmount: t.replace(/[^0-9.]/g, '') })} placeholder="0" placeholderTextColor={colors.textHint}
                  keyboardType="decimal-pad" style={styles.input}
                />
              </View>
            ) : null}

            {caps.compare ? (
              <View style={[styles.block, styles.switchRow]}>
                <Text style={styles.switchLabel}>Compare with previous period</Text>
                <Switch value={draft.compare} onValueChange={(v) => set({ compare: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.white} />
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={reset} style={[styles.btn, styles.btnGhost]}>
              <Text style={[styles.btnText, { color: colors.text }]}>Reset</Text>
            </Pressable>
            <Pressable
              disabled={!datesOk}
              onPress={() => { onApply(draft); onClose(); }}
              style={[styles.btn, styles.btnPrimary, !datesOk && { opacity: 0.5 }]}
            >
              <Text style={[styles.btnText, { color: colors.white }]}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: { backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: 20, paddingTop: 12 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 6 },
  block: { marginTop: 14, gap: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.6, color: colors.textSecondary, textTransform: 'uppercase' },
  sub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  dates: { flexDirection: 'row', gap: 10 },
  input: { height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  seg: { flexDirection: 'row', backgroundColor: colors.mintSoft, borderRadius: radius.md, padding: 3 },
  segItem: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segOn: { backgroundColor: colors.primaryDeep },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 },
  switchLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  btnPrimary: { backgroundColor: colors.primaryDeep },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 15 },
}));
