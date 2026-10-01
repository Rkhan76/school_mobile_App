import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { computePassPercent, type BandInput, type GradingScale, type GradingScaleInput } from './mockGrading';

type Props = {
  visible: boolean;
  /** null = create mode */
  scale: GradingScale | null;
  /** optional prefilled bands for create mode */
  initialBands?: BandInput[];
  onSubmit: (input: GradingScaleInput) => void;
  onClose: () => void;
};

type Draft = { id: string; label: string; min: string; gp: string; isPass: boolean };

let draftSeq = 0;
const newDraft = (over: Partial<Draft> = {}): Draft => ({
  id: `d${Date.now().toString(36)}${(draftSeq += 1)}`, label: '', min: '', gp: '', isPass: true, ...over,
});

const toDrafts = (bands: BandInput[]): Draft[] =>
  bands.map((b) => ({
    id: b.id, label: b.label, min: String(b.minPercent), gp: b.gradePoint === null ? '' : String(b.gradePoint), isPass: b.isPass,
  }));

const isIntIn = (s: string) => /^\d{1,3}$/.test(s.trim()) && Number(s) >= 0 && Number(s) <= 100;

export function ScaleEditorModal({ visible, scale, initialBands, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [nameErr, setNameErr] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(scale?.name ?? '');
    setDescription(scale?.description ?? '');
    setDrafts(scale ? toDrafts(scale.bands) : initialBands ? toDrafts(initialBands) : [newDraft({ min: '0' })]);
    setErrors([]);
    setNameErr(false);
  }, [visible, scale, initialBands]);

  // Live computed ranges: sort valid mins high->low, max = min of the band above - 1.
  const ranges = useMemo(() => {
    const valid = drafts.filter((d) => isIntIn(d.min)).sort((a, b) => Number(b.min) - Number(a.min));
    const map = new Map<string, string>();
    valid.forEach((d, i) => {
      const max = i === 0 ? 100 : Number(valid[i - 1].min) - 1;
      map.set(d.id, `${Number(d.min)}-${max}%`);
    });
    return map;
  }, [drafts]);

  const passLine = useMemo(
    () => computePassPercent(
      drafts.filter((d) => isIntIn(d.min)).map((d) => ({ minPercent: Number(d.min), isPass: d.isPass })),
    ),
    [drafts],
  );

  const patch = (id: string, p: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...p } : d)));

  const submit = () => {
    const errs: string[] = [];
    const n = name.trim();
    setNameErr(!n);
    if (!n) errs.push('Name is required.');
    if (drafts.length === 0) errs.push('Add at least one band.');
    if (drafts.some((d) => !d.label.trim())) errs.push('Every band needs a label.');
    const labels = drafts.map((d) => d.label.trim().toLowerCase()).filter(Boolean);
    if (new Set(labels).size !== labels.length) errs.push('Band labels must be unique.');
    if (drafts.some((d) => !isIntIn(d.min))) errs.push('Each band needs a whole-number minimum between 0 and 100.');
    else {
      const mins = drafts.map((d) => Number(d.min));
      if (new Set(mins).size !== mins.length) errs.push('Bands overlap: two bands share the same minimum %.');
      if (drafts.length > 0 && Math.min(...mins) !== 0) errs.push('The lowest band must start at 0% so every score is covered.');
    }
    if (drafts.some((d) => d.gp.trim() && !/^\d{1,2}(\.\d+)?$/.test(d.gp.trim()))) errs.push('Grade point must be a number.');
    setErrors(errs);
    if (errs.length) return;
    onSubmit({
      name: n,
      description: description.trim(),
      bands: drafts.map((d) => ({
        id: d.id,
        label: d.label.trim(),
        minPercent: Number(d.min),
        gradePoint: d.gp.trim() ? Number(d.gp) : null,
        isPass: d.isPass,
      })),
    });
  };

  const addBand = () => setDrafts((ds) => [...ds, newDraft()]);
  const removeBand = (id: string) => setDrafts((ds) => ds.filter((d) => d.id !== id));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.barTitle}>{scale ? 'Edit scale' : 'New scale'}</Text>
          <Pressable style={styles.saveTop} onPress={submit}>
            <Text style={styles.saveTopText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name} onChangeText={setName} placeholder="e.g. Percentage (A-F)"
            placeholderTextColor={colors.textHint} style={[styles.input, nameErr && styles.inputErr]}
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="Optional" multiline
            placeholderTextColor={colors.textHint} style={[styles.input, styles.multi]}
          />

          <View style={styles.bandsHead}>
            <Text style={styles.section}>Grade bands</Text>
            <Text style={styles.pass}>Pass line: {passLine}%</Text>
          </View>
          <Text style={styles.help}>
            Set each band's minimum %. The maximum is worked out from the band above it (the top band ends at 100%).
          </Text>

          {drafts.map((d, i) => (
            <View key={d.id} style={styles.band}>
              <View style={styles.bandTop}>
                <Text style={styles.bandNo}>Band {i + 1}</Text>
                <Text style={styles.range}>{ranges.get(d.id) ?? '--'}</Text>
                <Pressable onPress={() => removeBand(d.id)} hitSlop={8} accessibilityLabel={`Remove band ${i + 1}`}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
              <View style={styles.fields}>
                <View style={styles.f1}>
                  <Text style={styles.mini}>Label</Text>
                  <TextInput
                    value={d.label} onChangeText={(t) => patch(d.id, { label: t })} placeholder="A+"
                    placeholderTextColor={colors.textHint} autoCapitalize="characters" maxLength={10} style={styles.inputSm}
                  />
                </View>
                <View style={styles.f1}>
                  <Text style={styles.mini}>Min %</Text>
                  <TextInput
                    value={d.min} onChangeText={(t) => patch(d.id, { min: t.replace(/[^0-9]/g, '') })} placeholder="90"
                    placeholderTextColor={colors.textHint} keyboardType="number-pad" maxLength={3} style={styles.inputSm}
                  />
                </View>
                <View style={styles.f1}>
                  <Text style={styles.mini}>Grade pt</Text>
                  <TextInput
                    value={d.gp} onChangeText={(t) => patch(d.id, { gp: t.replace(/[^0-9.]/g, '') })} placeholder="opt."
                    placeholderTextColor={colors.textHint} keyboardType="decimal-pad" maxLength={5} style={styles.inputSm}
                  />
                </View>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>{d.isPass ? 'Counts as pass' : 'Counts as fail'}</Text>
                <Switch
                  value={d.isPass} onValueChange={(v) => patch(d.id, { isPass: v })}
                  trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white}
                />
              </View>
            </View>
          ))}

          <Pressable style={styles.addBand} onPress={addBand}>
            <Ionicons name="add" size={18} color={colors.primaryDeep} />
            <Text style={styles.addBandText}>Add band</Text>
          </Pressable>

          {errors.length ? (
            <View style={styles.errBox}>
              {errors.map((e) => <Text key={e} style={styles.err}>• {e}</Text>)}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={submit}>
              <Text style={styles.saveText}>{scale ? 'Save changes' : 'Create scale'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  barTitle: { flex: 1, fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  saveTop: { height: 40, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveTopText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  form: { paddingHorizontal: 16, gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  multi: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  bandsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  section: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  pass: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep, backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  help: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  band: { backgroundColor: colors.cardSolid, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8, marginTop: 6 },
  bandTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bandNo: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  range: { flex: 1, fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textSecondary },
  fields: { flexDirection: 'row', gap: 8 },
  f1: { flex: 1, gap: 3 },
  mini: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textHint },
  inputSm: {
    height: 40, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 10,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  addBand: {
    height: 44, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8,
  },
  addBandText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  errBox: { backgroundColor: colors.dangerBg, borderRadius: radius.md, padding: 12, gap: 4, marginTop: 10 },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
