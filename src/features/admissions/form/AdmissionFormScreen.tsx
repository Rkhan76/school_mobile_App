import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { DateInput } from '../../../components/ui/DateInput';
import { ScreenBackground } from '../../../components/ui/Screen';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { showToast } from '../../../components/ui/Toast';
import { ApiError } from '../../../lib/apiClient';
import { parseDisplayDate, toDisplayDate } from '../../../lib/date';
import { colors, fonts, radius, shadow, themed } from '../../../theme/tokens';
import { getAcademicYearsMaster, getClassesMaster } from '../../common/api';
import type { AcademicYearLean, ClassWithSections } from '../../common/types';
import { createAdmission, getAdmission, updateAdmission } from '../api';
import type { AdmissionDetail, AdmissionPayload, GuardianBlock } from '../types';

type Props = { mode: 'create' } | { mode: 'edit'; admissionId: string };

type GenderOption = 'Male' | 'Female' | 'Other';
type ParentForm = { name: string; phone: string; occupation: string; aadharNumber: string };

const emptyParent = (): ParentForm => ({ name: '', phone: '', occupation: '', aadharNumber: '' });

type FormState = {
  academicYear: string;
  classId: string;
  className: string;

  fullName: string;
  gender: GenderOption | null;
  dateOfBirth: string;
  category: string;
  subcategory: string;
  religion: string;
  phone: string;
  email: string;
  aadharNumber: string;

  father: ParentForm;
  mother: ParentForm;

  bloodGroup: string;
  height: string;
  weight: string;

  accountNumber: string;
  bankName: string;
  bankBranch: string;
  ifscCode: string;

  prevSchoolName: string;
  prevSchoolAddress: string;

  currentAddress: string;
  permanentAddress: string;

  hostelName: string;
  roomNumber: string;

  additionalDetails: string;
};

const initialForm: FormState = {
  academicYear: '',
  classId: '',
  className: '',
  fullName: '',
  gender: null,
  dateOfBirth: '',
  category: '',
  subcategory: '',
  religion: '',
  phone: '',
  email: '',
  aadharNumber: '',
  father: emptyParent(),
  mother: emptyParent(),
  bloodGroup: '',
  height: '',
  weight: '',
  accountNumber: '',
  bankName: '',
  bankBranch: '',
  ifscCode: '',
  prevSchoolName: '',
  prevSchoolAddress: '',
  currentAddress: '',
  permanentAddress: '',
  hostelName: '',
  roomNumber: '',
  additionalDetails: '',
};

const val = (s: string): string | undefined => (s.trim() ? s.trim() : undefined);

function parentFrom(b?: GuardianBlock | null): ParentForm {
  return {
    name: b?.name ?? '',
    phone: b?.phone ?? '',
    occupation: b?.occupation ?? '',
    aadharNumber: b?.aadharNumber ?? '',
  };
}

function formFromDetail(detail: AdmissionDetail): FormState {
  const pgi = detail.parentGuardianInfo;
  return {
    academicYear: detail.academicInfo?.year ?? '',
    classId: detail.academicInfo?.class ?? '',
    className: detail.className ?? '',
    fullName: detail.personalInfo?.fullName ?? '',
    gender: detail.personalInfo?.gender ?? null,
    dateOfBirth: toDisplayDate(detail.personalInfo?.dateOfBirth),
    category: detail.personalInfo?.category ?? '',
    subcategory: detail.personalInfo?.subcategory ?? '',
    religion: detail.personalInfo?.religion ?? '',
    phone: detail.personalInfo?.phone ?? '',
    email: detail.personalInfo?.email ?? '',
    aadharNumber: detail.personalInfo?.aadharNumber ?? '',
    father: parentFrom(pgi?.father),
    mother: parentFrom(pgi?.mother),
    bloodGroup: detail.medicalDetails?.bloodGroup ?? '',
    height: detail.medicalDetails?.height ?? '',
    weight: detail.medicalDetails?.weight ?? '',
    accountNumber: detail.bankDetails?.accountNumber ?? '',
    bankName: detail.bankDetails?.bankName ?? '',
    bankBranch: detail.bankDetails?.bankBranch ?? '',
    ifscCode: detail.bankDetails?.ifscCode ?? '',
    prevSchoolName: detail.previousSchoolDetails?.schoolName ?? '',
    prevSchoolAddress: detail.previousSchoolDetails?.address ?? '',
    currentAddress: detail.address?.currentAddress ?? '',
    permanentAddress: detail.address?.permanentAddress ?? '',
    hostelName: detail.hostelDetails?.hostelName ?? '',
    roomNumber: detail.hostelDetails?.roomNumber ?? '',
    additionalDetails: detail.additionalDetails ?? '',
  };
}

/** Drops empty values: the API never clears a field from "" or null, and empty keys only add noise. */
function compact<T extends object>(o: T): T | undefined {
  const out = Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
  return Object.keys(out).length ? (out as T) : undefined;
}

/** The request body for the current form values, section by section. */
function buildSections(form: FormState): AdmissionPayload {
  const parent = (p: ParentForm) =>
    compact({ name: val(p.name), phone: val(p.phone), aadharNumber: val(p.aadharNumber), occupation: val(p.occupation) });
  const father = parent(form.father);
  const mother = parent(form.mother);
  return {
    academicInfo: compact({ year: form.academicYear || undefined, class: form.classId || undefined }),
    personalInfo: {
      gender: (form.gender ?? 'Male') as GenderOption,
      ...compact({
        fullName: val(form.fullName),
        dateOfBirth: val(parseDisplayDate(form.dateOfBirth) ?? form.dateOfBirth),
        category: val(form.category),
        subcategory: val(form.subcategory),
        religion: val(form.religion),
        phone: val(form.phone),
        email: val(form.email),
        aadharNumber: val(form.aadharNumber),
      }),
    },
    parentGuardianInfo: father || mother ? { ...(father ? { father } : {}), ...(mother ? { mother } : {}) } : undefined,
    medicalDetails: compact({ bloodGroup: val(form.bloodGroup), height: val(form.height), weight: val(form.weight) }),
    bankDetails: compact({ accountNumber: val(form.accountNumber), bankName: val(form.bankName), bankBranch: val(form.bankBranch), ifscCode: val(form.ifscCode) }),
    previousSchoolDetails: compact({ schoolName: val(form.prevSchoolName), address: val(form.prevSchoolAddress) }),
    address: compact({ currentAddress: val(form.currentAddress), permanentAddress: val(form.permanentAddress) }),
    hostelDetails: compact({ hostelName: val(form.hostelName), roomNumber: val(form.roomNumber) }),
    additionalDetails: val(form.additionalDetails),
  };
}

/**
 * Create sends everything. Edit sends only the sections that changed: the API replaces an object section whole,
 * so a changed section goes out complete and the untouched ones are left alone.
 */
function buildPayload(form: FormState, original?: FormState): Partial<AdmissionPayload> {
  const next = buildSections(form);
  if (!original) return next;
  const prev = buildSections(original);
  const keys = (Object.keys(next) as (keyof AdmissionPayload)[]).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(prev[k]));
  return Object.fromEntries(keys.filter((k) => next[k] !== undefined).map((k) => [k, next[k]]));
}

/** Matches an API validation message (they are plain strings) to the form field it is about. */
const FIELD_HINTS: [string, RegExp][] = [
  ['father.name', /father.*name/i], ['father.phone', /father.*phone/i], ['father.aadharNumber', /father.*aadhar/i], ['father.occupation', /father.*occupation/i],
  ['mother.name', /mother.*name/i], ['mother.phone', /mother.*phone/i], ['mother.aadharNumber', /mother.*aadhar/i], ['mother.occupation', /mother.*occupation/i],
  ['gender', /gender/i], ['fullName', /fullName/i], ['dateOfBirth', /dateOfBirth|birth/i], ['category', /^(personalInfo\.)?category/i],
  ['subcategory', /subcategory/i], ['religion', /religion/i], ['phone', /phone/i], ['email', /email/i], ['aadharNumber', /aadhar/i],
  ['classId', /class/i], ['academicYear', /year/i],
  ['bloodGroup', /bloodGroup/i], ['height', /height/i], ['weight', /weight/i],
  ['accountNumber', /accountNumber/i], ['bankName', /bankName/i], ['bankBranch', /bankBranch/i], ['ifscCode', /ifsc/i],
  ['prevSchoolName', /schoolName/i], ['prevSchoolAddress', /previousSchool.*address/i],
  ['currentAddress', /currentAddress/i], ['permanentAddress', /permanentAddress/i],
  ['hostelName', /hostelName/i], ['roomNumber', /roomNumber/i], ['additionalDetails', /additionalDetails/i],
];

type FieldErrors = { byField: Record<string, string>; general: string[] };

function splitErrors(err: unknown): FieldErrors {
  const byField: Record<string, string> = {};
  const general: string[] = [];
  const raw = err instanceof ApiError ? (err.body as { message?: unknown } | undefined)?.message : undefined;
  const messages = Array.isArray(raw)
    ? raw.map(String)
    : [err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'];
  for (const m of messages) {
    const hit = FIELD_HINTS.find(([, re]) => re.test(m));
    if (hit && !byField[hit[0]]) byField[hit[0]] = m;
    else general.push(m);
  }
  return { byField, general };
}

function SectionCard({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: ReactNode }) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.primaryDeep} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </Card>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  required,
  isDate,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  required?: boolean;
  isDate?: boolean;
  /** Validation message from the API for this field. */
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {isDate ? (
        <DateInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={styles.input} maximumDate={new Date()} />
      ) : (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError]}
      />
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Social categories used in Indian school admissions (the short code is what gets saved). */
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'General', label: 'General' },
  { value: 'OBC', label: 'OBC (Other Backward Classes)' },
  { value: 'SC', label: 'SC (Scheduled Caste)' },
  { value: 'ST', label: 'ST (Scheduled Tribe)' },
  { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
];

function OptionPickerModal({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetOptions}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onSelect(o.value);
                  onClose();
                }}
                style={[styles.sheetOpt, active && styles.sheetOptActive]}
              >
                <Text style={[styles.sheetOptText, active && styles.sheetOptTextActive]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ClassPickerModal({
  visible,
  classes,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  classes: ClassWithSections[];
  value: string;
  onSelect: (c: ClassWithSections) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Select class</Text>
        <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetOptions}>
          {classes.map((c) => {
            const active = c.id === value;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  onSelect(c);
                  onClose();
                }}
                style={[styles.sheetOpt, active && styles.sheetOptActive]}
              >
                <Text style={[styles.sheetOptText, active && styles.sheetOptTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
          {classes.length === 0 ? <Text style={styles.empty}>No classes available</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function AdmissionFormScreen(props: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mode = props.mode;
  const admissionId = props.mode === 'edit' ? props.admissionId : undefined;

  const [form, setForm] = useState<FormState>(initialForm);
  /** The form as loaded for editing, so only the sections that changed are sent. */
  const [original, setOriginal] = useState<FormState | undefined>(undefined);
  const [errors, setErrors] = useState<FieldErrors>({ byField: {}, general: [] });

  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [years, setYears] = useState<AcademicYearLean[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [blockedStatus, setBlockedStatus] = useState<AdmissionDetail['status'] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [classesRes, yearsRes, detailRes] = await Promise.all([
          getClassesMaster(),
          getAcademicYearsMaster(),
          admissionId ? getAdmission(admissionId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setClasses(classesRes);
        setYears(yearsRes);

        if (detailRes) {
          if (detailRes.status !== 'pending') {
            setBlockedStatus(detailRes.status);
          } else {
            const loaded = formFromDetail(detailRes);
            setForm(loaded);
            setOriginal(loaded);
          }
        } else {
          const active = yearsRes.find((y) => y.isActive);
          if (active) setForm((f) => ({ ...f, academicYear: active.id }));
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Failed to load form data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [admissionId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setParentField = (which: 'father' | 'mother', key: keyof ParentForm, value: string) => {
    setForm((f) => ({ ...f, [which]: { ...f[which], [key]: value } }));
  };

  // Fields that are pickers/chips have no inline slot, so their messages (and unmatched ones) go in the banner.
  const bannerErrors = [...errors.general, ...['gender', 'category', 'classId', 'academicYear'].map((k) => errors.byField[k]).filter(Boolean)];

  const canSubmit = useMemo(
    () => !submitting && !!form.gender && !!form.classId,
    [submitting, form.gender, form.classId]
  );

  const submit = async () => {
    if (!form.gender) {
      Alert.alert('Gender required', "Please select the student's gender.");
      return;
    }
    if (!form.classId) {
      Alert.alert('Class required', 'Please select a class for this application.');
      return;
    }
    if (form.dateOfBirth.trim() && !parseDisplayDate(form.dateOfBirth)) {
      Alert.alert('Invalid date', 'Enter the date of birth as dd/mm/yyyy.');
      return;
    }

    const digitsOnly = (v: string) => !v.trim() || /^\d+$/.test(v.trim());
    const phones = [form.phone, form.father.phone, form.mother.phone];
    const aadhars = [form.aadharNumber, form.father.aadharNumber, form.mother.aadharNumber];
    if (!phones.every(digitsOnly)) {
      Alert.alert('Invalid phone number', 'Phone numbers must contain digits only.');
      return;
    }
    if (!aadhars.every((a) => digitsOnly(a) && a.trim().length <= 20)) {
      Alert.alert('Invalid Aadhar number', 'Aadhar numbers must contain digits only (max 20).');
      return;
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    const dob = parseDisplayDate(form.dateOfBirth);
    if (dob && dob > new Date().toISOString().slice(0, 10)) {
      Alert.alert('Invalid date', 'Date of birth cannot be in the future.');
      return;
    }

    setErrors({ byField: {}, general: [] });
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const result = await createAdmission(buildPayload(form) as AdmissionPayload);
        showToast('Application submitted');
        router.replace(`/admissions/${result.id}`);
      } else if (admissionId) {
        const payload = buildPayload(form, original);
        if (Object.keys(payload).length === 0) {
          router.back();
          return;
        }
        await updateAdmission(admissionId, payload);
        showToast('Changes saved');
        router.back();
      }
    } catch (err) {
      const split = splitErrors(err);
      setErrors(split);
      if (err instanceof ApiError && err.statusCode === 400) {
        showToast('Please fix the highlighted fields');
      } else {
        Alert.alert('Could not save', err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'edit' && blockedStatus) {
    return (
      <ScreenBackground>
        <ScreenHeader title="Edit Application" back />
        <View style={styles.blockedWrap}>
          <Card style={styles.blockedCard}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.textHint} />
            <Text style={styles.blockedTitle}>This application can no longer be edited</Text>
            <Text style={styles.blockedSub}>It is currently {blockedStatus}.</Text>
            <Pressable
              style={styles.blockedBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/admissions'))}
            >
              <Text style={styles.blockedBtnText}>Go back</Text>
            </Pressable>
          </Card>
        </View>
      </ScreenBackground>
    );
  }

  if (loading) {
    return (
      <ScreenBackground>
        <ScreenHeader title={mode === 'create' ? 'New Application' : 'Edit Application'} back />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenBackground>
    );
  }

  if (mode === 'edit' && loadError) {
    return (
      <ScreenBackground>
        <ScreenHeader title="Edit Application" back />
        <View style={styles.blockedWrap}>
          <Card style={styles.blockedCard}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
            <Text style={styles.blockedTitle}>Could not load this application</Text>
            <Text style={styles.blockedSub}>{loadError}</Text>
          </Card>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScreenHeader title={mode === 'create' ? 'New Application' : 'Edit Application'} back />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {bannerErrors.length > 0 ? (
          <View style={styles.errorBanner}>
            {bannerErrors.map((m) => (
              <Text key={m} style={styles.errorText}>{m}</Text>
            ))}
          </View>
        ) : null}
        <SectionCard title="Academic Info" icon="school-outline">
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Academic Year</Text>
            <ChipRow
              // The backend needs the academic year's UUID (a label here makes the detail API fail).
              options={years.map((y) => ({ key: y.id, label: y.label }))}
              value={form.academicYear || null}
              onChange={(v) => setField('academicYear', v)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Class<Text style={styles.required}> *</Text>
            </Text>
            <Pressable style={styles.selectBox} onPress={() => setClassPickerOpen(true)}>
              <Text style={form.className ? styles.selectValue : styles.selectPlaceholder}>
                {form.className || 'Select a class'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textHint} />
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard title="Personal Info" icon="person-outline">
          <Field label="Full Name" value={form.fullName} onChangeText={(t) => setField('fullName', t)} placeholder="Student's full name" error={errors.byField.fullName} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Gender<Text style={styles.required}> *</Text>
            </Text>
            <ChipRow
              options={[
                { key: 'Male' as GenderOption, label: 'Male' },
                { key: 'Female' as GenderOption, label: 'Female' },
                { key: 'Other' as GenderOption, label: 'Other' },
              ]}
              value={form.gender}
              onChange={(v) => setField('gender', v)}
            />
          </View>
          <Field
            label="Date of Birth"
            value={form.dateOfBirth}
            onChangeText={(t) => setField('dateOfBirth', t)}
            placeholder="dd/mm/yyyy"
            isDate error={errors.byField.dateOfBirth}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <Pressable style={styles.selectBox} onPress={() => setCategoryPickerOpen(true)} accessibilityRole="button" accessibilityLabel="Select category">
              <Text style={form.category ? styles.selectValue : styles.selectPlaceholder}>
                {form.category || 'Select category'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textHint} />
            </Pressable>
          </View>
          <Field label="Subcategory" value={form.subcategory} onChangeText={(t) => setField('subcategory', t)} error={errors.byField.subcategory} />
          <Field label="Religion" value={form.religion} onChangeText={(t) => setField('religion', t)} error={errors.byField.religion} />
          <Field label="Phone" value={form.phone} onChangeText={(t) => setField('phone', t)} keyboardType="phone-pad" error={errors.byField.phone} />
          <Field label="Email" value={form.email} onChangeText={(t) => setField('email', t)} keyboardType="email-address" error={errors.byField.email} />
          <Field label="Aadhar Number" value={form.aadharNumber} onChangeText={(t) => setField('aadharNumber', t)} keyboardType="number-pad" error={errors.byField.aadharNumber} />
        </SectionCard>

        <SectionCard title="Parents" icon="people-outline">
          {(['father', 'mother'] as const).map((who) => (
            <View key={who} style={styles.sectionBody}>
              <Text style={styles.subHeading}>{who === 'father' ? 'Father' : 'Mother'}</Text>
              <Field label="Name" value={form[who].name} onChangeText={(t) => setParentField(who, 'name', t)} error={errors.byField[`${who}.name`]} />
              <Field label="Phone" value={form[who].phone} onChangeText={(t) => setParentField(who, 'phone', t)} keyboardType="phone-pad" error={errors.byField[`${who}.phone`]} />
              <Field label="Occupation" value={form[who].occupation} onChangeText={(t) => setParentField(who, 'occupation', t)} error={errors.byField[`${who}.occupation`]} />
              <Field label="Aadhar Number" value={form[who].aadharNumber} onChangeText={(t) => setParentField(who, 'aadharNumber', t)} keyboardType="number-pad" error={errors.byField[`${who}.aadharNumber`]} />
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Medical Details" icon="medkit-outline">
          <Field label="Blood Group" value={form.bloodGroup} onChangeText={(t) => setField('bloodGroup', t)} placeholder="e.g. O+" error={errors.byField.bloodGroup} />
          <Field label="Height" value={form.height} onChangeText={(t) => setField('height', t)} placeholder="e.g. 150cm" error={errors.byField.height} />
          <Field label="Weight" value={form.weight} onChangeText={(t) => setField('weight', t)} placeholder="e.g. 45kg" error={errors.byField.weight} />
        </SectionCard>

        <SectionCard title="Bank Details" icon="card-outline">
          <Field label="Account Number" value={form.accountNumber} onChangeText={(t) => setField('accountNumber', t)} keyboardType="number-pad" error={errors.byField.accountNumber} />
          <Field label="Bank Name" value={form.bankName} onChangeText={(t) => setField('bankName', t)} error={errors.byField.bankName} />
          <Field label="Bank Branch" value={form.bankBranch} onChangeText={(t) => setField('bankBranch', t)} error={errors.byField.bankBranch} />
          <Field label="IFSC Code" value={form.ifscCode} onChangeText={(t) => setField('ifscCode', t.toUpperCase())} error={errors.byField.ifscCode} />
        </SectionCard>

        <SectionCard title="Previous School" icon="business-outline">
          <Field label="School Name" value={form.prevSchoolName} onChangeText={(t) => setField('prevSchoolName', t)} error={errors.byField.prevSchoolName} />
          <Field label="Address" value={form.prevSchoolAddress} onChangeText={(t) => setField('prevSchoolAddress', t)} multiline error={errors.byField.prevSchoolAddress} />
        </SectionCard>

        <SectionCard title="Address" icon="location-outline">
          <Field label="Current Address" value={form.currentAddress} onChangeText={(t) => setField('currentAddress', t)} multiline error={errors.byField.currentAddress} />
          <Field label="Permanent Address" value={form.permanentAddress} onChangeText={(t) => setField('permanentAddress', t)} multiline error={errors.byField.permanentAddress} />
        </SectionCard>

        <SectionCard title="Additional Details" icon="create-outline">
          <Field
            label="Notes"
            value={form.additionalDetails}
            onChangeText={(t) => setField('additionalDetails', t)}
            multiline
            placeholder="Anything else worth noting" error={errors.byField.additionalDetails}
          />
        </SectionCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]} onPress={submit} disabled={!canSubmit}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>{mode === 'create' ? 'Submit Application' : 'Save Changes'}</Text>
          )}
        </Pressable>
      </View>

      <OptionPickerModal
        visible={categoryPickerOpen}
        title="Select category"
        // A category saved earlier that isn't in the standard list stays selectable instead of being lost.
        options={
          form.category && !CATEGORY_OPTIONS.some((o) => o.value === form.category)
            ? [...CATEGORY_OPTIONS, { value: form.category, label: form.category }]
            : CATEGORY_OPTIONS
        }
        value={form.category}
        onSelect={(v) => setField('category', v)}
        onClose={() => setCategoryPickerOpen(false)}
      />
      <ClassPickerModal
        visible={classPickerOpen}
        classes={classes}
        value={form.classId}
        onSelect={(c) => setForm((f) => ({ ...f, classId: c.id, className: c.name }))}
        onClose={() => setClassPickerOpen(false)}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  sectionBody: { gap: 14 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  required: { color: colors.danger },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSolid,
    paddingHorizontal: 14,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  inputMultiline: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  errorBanner: { backgroundColor: colors.cardSolid, borderColor: colors.danger, borderWidth: 1, borderRadius: radius.md, padding: 12, gap: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  selectBox: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSolid,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  selectPlaceholder: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textHint },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTextWrap: { flex: 1, gap: 4 },
  toggleHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  subHeading: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primaryDeep, marginTop: 4 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.backgroundGlass,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  submitBtn: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.white },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockedWrap: { flex: 1, paddingHorizontal: 16, justifyContent: 'center' },
  blockedCard: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  blockedTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text, textAlign: 'center' },
  blockedSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  blockedBtn: {
    marginTop: 8,
    height: 46,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedBtnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 12 },
  sheetScroll: { flexGrow: 0 },
  sheetOptions: { gap: 8, paddingBottom: 8 },
  sheetOpt: {
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetOptActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sheetOptText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary },
  sheetOptTextActive: { color: colors.white },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint, textAlign: 'center', paddingVertical: 20 },
}));
