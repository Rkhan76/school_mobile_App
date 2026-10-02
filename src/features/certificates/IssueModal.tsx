import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { ApiError } from '../../lib/apiClient';
import { colors, fonts, radius } from '../../theme/tokens';
import { getAcademicYearsMaster } from '../common/api';
import type { AcademicYearLean } from '../common/types';
import { lookupNonTeachingStaff, lookupStudents, lookupTeachers, type IssueCertificateInput } from './api';
import { RECIPIENT_TYPES, RECIPIENT_TYPE_LABEL, inputToIso, isoToInput, todayIso, type RecipientType } from './types';

type Props = { visible: boolean; onSubmit: (input: IssueCertificateInput) => Promise<void>; onClose: () => void };
type Errors = Partial<Record<'recipient' | 'title' | 'issueDate', string>>;
type PickerOption = { id: string; label: string };

/** Driver has no lookup/list endpoint anywhere in the API — fall back to a free-text id field for it. */
const PICKER_BACKED: RecipientType[] = ['STUDENT', 'TEACHER', 'NON_TEACHING_STAFF'];

async function lookup(kind: RecipientType, search: string): Promise<PickerOption[]> {
  if (kind === 'STUDENT') {
    const rows = await lookupStudents(search);
    return rows.map((r) => ({ id: r.id, label: r.name }));
  }
  if (kind === 'TEACHER') {
    const rows = await lookupTeachers(search);
    return rows.map((r) => ({ id: r.id, label: r.fullName }));
  }
  if (kind === 'NON_TEACHING_STAFF') {
    const rows = await lookupNonTeachingStaff(search);
    return rows.map((r) => ({ id: r.id, label: r.fullName }));
  }
  return [];
}

export function IssueModal({ visible, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [recipientKind, setRecipientKind] = useState<RecipientType>('STUDENT');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [options, setOptions] = useState<PickerOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [recipient, setRecipient] = useState<PickerOption | null>(null);
  const [driverRecipientId, setDriverRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(isoToInput(todayIso()));
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [academicYears, setAcademicYears] = useState<AcademicYearLean[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    if (visible) {
      setRecipientKind('STUDENT');
      setQuery('');
      setDebouncedQuery('');
      setOptions([]);
      setRecipient(null);
      setDriverRecipientId('');
      setTitle('');
      setDescription('');
      setDate(isoToInput(todayIso()));
      setSignatoryName('');
      setSignatoryTitle('');
      setAcademicYearId('');
      setErrors({});
      setSubmitError('');
      setSubmitting(false);
      getAcademicYearsMaster().then(setAcademicYears).catch(() => setAcademicYears([]));
    }
  }, [visible]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!visible || !PICKER_BACKED.includes(recipientKind)) return;
    const myRequest = ++requestId.current;
    setSearching(true);
    lookup(recipientKind, debouncedQuery)
      .then((rows) => {
        if (myRequest !== requestId.current) return;
        setOptions(rows);
      })
      .catch(() => {
        if (myRequest === requestId.current) setOptions([]);
      })
      .finally(() => {
        if (myRequest === requestId.current) setSearching(false);
      });
  }, [visible, recipientKind, debouncedQuery]);

  const pickRecipientKind = (k: RecipientType) => {
    setRecipientKind(k);
    setRecipient(null);
    setDriverRecipientId('');
    setQuery('');
    setOptions([]);
  };

  const submit = async () => {
    if (submitting) return;
    const e: Errors = {};
    const recipientId = recipientKind === 'DRIVER' ? driverRecipientId.trim() : recipient?.id;
    if (!recipientId) e.recipient = recipientKind === 'DRIVER' ? 'Enter the driver’s recipient id.' : 'Select a recipient.';
    if (!title.trim()) e.title = 'Title is required.';
    const iso = inputToIso(date);
    if (!iso) e.issueDate = 'Enter a valid date as DD/MM/YYYY.';
    else if (iso > todayIso()) e.issueDate = 'Issue date cannot be in the future.';
    setErrors(e);
    if (Object.keys(e).length > 0 || !recipientId || !iso) return;

    setSubmitError('');
    setSubmitting(true);
    try {
      await onSubmit({
        recipientType: recipientKind,
        recipientId,
        title: title.trim(),
        description: description.trim() || undefined,
        issueDate: iso,
        signatoryName: signatoryName.trim() || undefined,
        signatoryTitle: signatoryTitle.trim() || undefined,
        academicYearId: academicYearId || undefined,
      });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const isPickerBacked = PICKER_BACKED.includes(recipientKind);

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
          <Text style={styles.label}>Recipient *</Text>
          <View style={styles.chips}>
            {RECIPIENT_TYPES.map((k) => {
              const on = k === recipientKind;
              return (
                <Pressable key={k} onPress={() => pickRecipientKind(k)} style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{RECIPIENT_TYPE_LABEL[k]}</Text>
                </Pressable>
              );
            })}
          </View>

          {isPickerBacked ? (
            <>
              <View style={styles.searchField}>
                <Ionicons name="search-outline" size={18} color={colors.textHint} />
                <TextInput
                  value={query} onChangeText={setQuery}
                  placeholder={`Search ${RECIPIENT_TYPE_LABEL[recipientKind].toLowerCase()}s...`}
                  placeholderTextColor={colors.textHint} style={styles.searchInput} autoCorrect={false}
                />
                {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              </View>
              <View style={[styles.list, !!errors.recipient && styles.inputErr]}>
                {options.length === 0 ? (
                  <Text style={styles.none}>{searching ? 'Searching...' : 'No matches found.'}</Text>
                ) : (
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {options.map((r) => {
                      const on = recipient?.id === r.id;
                      return (
                        <Pressable key={r.id} onPress={() => setRecipient(r)} style={[styles.row, on && styles.rowOn]}>
                          <Avatar name={r.label} size={32} />
                          <View style={styles.rowText}>
                            <Text style={styles.rowName}>{r.label}</Text>
                          </View>
                          {on && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.hint}>
                No lookup is available for drivers yet — enter their recipient id directly.
              </Text>
              <TextInput
                value={driverRecipientId} onChangeText={setDriverRecipientId}
                placeholder="Driver recipient id (uuid)" placeholderTextColor={colors.textHint}
                style={[styles.input, !!errors.recipient && styles.inputErr]}
                autoCapitalize="none" autoCorrect={false}
              />
            </>
          )}
          {errors.recipient ? <Text style={styles.err}>{errors.recipient}</Text> : null}

          <Text style={styles.label}>Title *</Text>
          <TextInput
            value={title} onChangeText={setTitle} placeholder="e.g. Best Teacher of the Year" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.title && styles.inputErr]}
          />
          {errors.title ? <Text style={styles.err}>{errors.title}</Text> : null}

          <Text style={styles.label}>Description / citation (optional)</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="Citation text to print on the certificate"
            placeholderTextColor={colors.textHint} multiline style={[styles.input, styles.multi]}
          />

          <Text style={styles.label}>Issue date</Text>
          <TextInput
            value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.issueDate && styles.inputErr]}
          />
          {errors.issueDate ? <Text style={styles.err}>{errors.issueDate}</Text> : null}

          <Text style={styles.label}>Signatory name (optional)</Text>
          <TextInput
            value={signatoryName} onChangeText={setSignatoryName} placeholder="e.g. Dr. Anita Sharma"
            placeholderTextColor={colors.textHint} style={styles.input}
          />

          <Text style={styles.label}>Signatory title (optional)</Text>
          <TextInput
            value={signatoryTitle} onChangeText={setSignatoryTitle} placeholder="e.g. Principal"
            placeholderTextColor={colors.textHint} style={styles.input}
          />

          {academicYears.length > 0 ? (
            <>
              <Text style={styles.label}>Academic year (optional, defaults to active year)</Text>
              <View style={styles.chips}>
                <Pressable
                  onPress={() => setAcademicYearId('')}
                  style={[styles.chip, academicYearId === '' && styles.chipOn]}
                >
                  <Text style={[styles.chipText, academicYearId === '' && styles.chipTextOn]}>Default</Text>
                </Pressable>
                {academicYears.map((y) => {
                  const on = academicYearId === y.id;
                  return (
                    <Pressable key={y.id} onPress={() => setAcademicYearId(y.id)} style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{y.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </ScrollView>
        {submitError ? <Text style={[styles.err, styles.submitErr]}>{submitError}</Text> : null}
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save, submitting && styles.off]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Issue certificate</Text>}
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
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  multi: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  submitErr: { textAlign: 'center', paddingHorizontal: 16, paddingTop: 8, backgroundColor: colors.cardSolid },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
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
  off: { opacity: 0.6 },
});
