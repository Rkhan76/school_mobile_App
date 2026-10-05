import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { ApiError } from '../../lib/apiClient';
import { maskDateInput, parseDisplayDate } from '../../lib/date';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { CreateNTSPayload, CreateTeacherPayload, Gender } from './types';

type Kind = 'teacher' | 'staff';

type Props = {
  visible: boolean;
  kind: Kind;
  onSubmit: (payload: CreateTeacherPayload | CreateNTSPayload) => Promise<void>;
  onClose: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS: readonly Gender[] = ['Male', 'Female', 'Other'];

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong.';
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

function GenderChips({ value, onChange }: { value?: Gender; onChange: (g?: Gender) => void }) {
  return (
    <View style={styles.chips}>
      {GENDERS.map((g) => {
        const on = value === g;
        return (
          <Pressable key={g} onPress={() => onChange(on ? undefined : g)} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{g}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmployeeFormSheet({ visible, kind, onSubmit, onClose }: Props) {
  const isTeacher = kind === 'teacher';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [createLogin, setCreateLogin] = useState(isTeacher); // teachers always get a login; staff defaults off
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFirstName('');
    setLastName('');
    setEmail('');
    setCreateLogin(isTeacher);
    setFullName('');
    setGender(undefined);
    setPhone('');
    setQualification('');
    setJoiningDate('');
    setDesignation('');
    setDepartment('');
    setTouched(false);
    setSubmitting(false);
    // Re-seed only when the sheet opens or the kind changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, kind]);

  const needsLoginFields = isTeacher || createLogin;
  const firstNameError = needsLoginFields && !firstName.trim() ? 'First name is required.' : null;
  const lastNameError = needsLoginFields && !lastName.trim() ? 'Last name is required.' : null;
  const emailError = needsLoginFields
    ? !email.trim()
      ? 'Email is required.'
      : !EMAIL_RE.test(email.trim())
        ? 'Enter a valid email address.'
        : null
    : null;

  const submit = async () => {
    setTouched(true);
    if (firstNameError || lastNameError || emailError) return;
    if (isTeacher && joiningDate.trim() && !parseDisplayDate(joiningDate)) { Alert.alert('Invalid date', 'Enter the joining date as dd/mm/yyyy.'); return; }
    setSubmitting(true);
    try {
      if (isTeacher) {
        const payload: CreateTeacherPayload = {
          loginDetails: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() },
          personalInfo: {
            fullName: fullName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim(),
            gender,
            phone: phone.trim() || undefined,
            qualification: qualification.trim() || undefined,
            joiningDate: parseDisplayDate(joiningDate) ?? (joiningDate.trim() || undefined),
          },
        };
        await onSubmit(payload);
      } else {
        const payload: CreateNTSPayload = {
          loginDetails: createLogin
            ? { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }
            : undefined,
          staffInfo: {
            designation: designation.trim() || undefined,
            department: department.trim() || undefined,
          },
          personalInfo: {
            fullName: fullName.trim() || undefined,
            gender,
            phone: phone.trim() || undefined,
          },
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      Alert.alert('Error', errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{isTeacher ? 'Add Teacher' : 'Add Non-Teaching Staff'}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            {!isTeacher ? (
              <View style={styles.loginToggle}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Create portal login</Text>
                  <Text style={styles.hint}>Off by default — leave off for staff who never need to log in.</Text>
                </View>
                <Switch
                  value={createLogin}
                  onValueChange={setCreateLogin}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            ) : null}

            {needsLoginFields ? (
              <>
                <Field label="First name *" error={touched ? firstNameError : null}>
                  <TextInput value={firstName} onChangeText={setFirstName} placeholder="e.g. Aarav" placeholderTextColor={colors.textHint} style={styles.input} autoFocus={isTeacher} />
                </Field>
                <Field label="Last name *" error={touched ? lastNameError : null}>
                  <TextInput value={lastName} onChangeText={setLastName} placeholder="e.g. Iyer" placeholderTextColor={colors.textHint} style={styles.input} />
                </Field>
                <Field label="Email *" error={touched ? emailError : null}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@school.com"
                    placeholderTextColor={colors.textHint}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </Field>
                <Text style={styles.hint}>
                  {isTeacher
                    ? 'No password is set here — the teacher gets an emailed link to set their own password.'
                    : 'They will get an emailed link to set their own password.'}
                </Text>
              </>
            ) : null}

            {!isTeacher ? (
              <>
                <Field label="Designation">
                  <TextInput value={designation} onChangeText={setDesignation} placeholder="e.g. Accountant" placeholderTextColor={colors.textHint} style={styles.input} />
                </Field>
                <Field label="Department">
                  <TextInput value={department} onChangeText={setDepartment} placeholder="e.g. Administration" placeholderTextColor={colors.textHint} style={styles.input} />
                </Field>
              </>
            ) : null}

            <Field label="Full name">
              <TextInput value={fullName} onChangeText={setFullName} placeholder="Display name (optional)" placeholderTextColor={colors.textHint} style={styles.input} />
            </Field>
            <Field label="Gender">
              <GenderChips value={gender} onChange={setGender} />
            </Field>
            <Field label="Phone">
              <TextInput value={phone} onChangeText={setPhone} placeholder="10-digit number" placeholderTextColor={colors.textHint} style={styles.input} keyboardType="phone-pad" />
            </Field>
            {isTeacher ? (
              <>
                <Field label="Qualification">
                  <TextInput value={qualification} onChangeText={setQualification} placeholder="e.g. M.Ed" placeholderTextColor={colors.textHint} style={styles.input} />
                </Field>
                <Field label="Joining date">
                  <TextInput value={joiningDate} onChangeText={(t) => setJoiningDate(maskDateInput(t))} placeholder="dd/mm/yyyy" keyboardType="number-pad" placeholderTextColor={colors.textHint} style={styles.input} />
                </Field>
              </>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save]} onPress={submit} disabled={submitting}>
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Create</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, paddingBottom: 28, maxHeight: '90%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 12 },
  form: { gap: 14, paddingBottom: 8 },
  field: { gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  loginToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.mintSoft, borderRadius: radius.md, padding: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  chipTextOn: { color: colors.white },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
}));
