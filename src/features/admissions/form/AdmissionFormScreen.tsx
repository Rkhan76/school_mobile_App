import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import type {
  AdmissionDetail,
  AdmissionFileField,
  AdmissionFilePart,
  AdmissionFiles,
  AdmissionPayload,
  GuardianBlock,
} from '../types';
import { GuardianPicker } from './GuardianPicker';
import { ImagePickerField } from './ImagePickerField';

type Props = { mode: 'create' } | { mode: 'edit'; admissionId: string };

type GenderOption = 'Male' | 'Female' | 'Other';
type PrimaryGuardianOption = 'father' | 'mother' | 'other';
type GuardianBlockForm = {
  name: string; phone: string; email: string; occupation: string; aadharNumber: string;
  /** Guardian block only. */
  relation: string; mobileNumber: string; address: string;
};

const emptyGuardianBlock = (): GuardianBlockForm => ({
  name: '', phone: '', email: '', occupation: '', aadharNumber: '', relation: '', mobileNumber: '', address: '',
});

type FormState = {
  academicYear: string;
  classId: string;
  className: string;
  rollNumber: string;

  fullName: string;
  gender: GenderOption | null;
  dateOfBirth: string;
  category: string;
  subcategory: string;
  religion: string;
  phone: string;
  email: string;
  aadharNumber: string;

  isGuardianExist: boolean;
  guardianId: string | null;

  primaryGuardian: PrimaryGuardianOption;
  father: GuardianBlockForm;
  mother: GuardianBlockForm;
  guardian: GuardianBlockForm;
  /** Parent/guardian already exists as a guardian profile: its details are edited there, not here. */
  linked: { father: boolean; mother: boolean; guardian: boolean };

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

  documentName: string;

  additionalDetails: string;
};

const initialForm: FormState = {
  academicYear: '',
  classId: '',
  className: '',
  rollNumber: '',
  fullName: '',
  gender: null,
  dateOfBirth: '',
  category: '',
  subcategory: '',
  religion: '',
  phone: '',
  email: '',
  aadharNumber: '',
  isGuardianExist: false,
  guardianId: null,
  primaryGuardian: 'father',
  father: emptyGuardianBlock(),
  linked: { father: false, mother: false, guardian: false },
  mother: emptyGuardianBlock(),
  guardian: emptyGuardianBlock(),
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
  documentName: '',
  additionalDetails: '',
};

const val = (s: string): string | undefined => (s.trim() ? s.trim() : undefined);

function blockFrom(b?: GuardianBlock | null): GuardianBlockForm {
  return {
    name: b?.name ?? '',
    phone: b?.phone ?? '',
    email: b?.email ?? '',
    occupation: b?.occupation ?? '',
    aadharNumber: b?.aadharNumber ?? '',
    relation: b?.relation ?? '',
    mobileNumber: b?.mobileNumber ?? '',
    address: b?.address ?? '',
  };
}

function formFromDetail(detail: AdmissionDetail): FormState {
  const pgi = detail.parentGuardianInfo;
  return {
    academicYear: detail.academicInfo?.year ?? '',
    classId: detail.academicInfo?.class ?? '',
    className: detail.className ?? '',
    rollNumber: detail.academicInfo?.rollNumber ?? detail.rollNumber ?? '',
    fullName: detail.personalInfo?.fullName ?? '',
    gender: detail.personalInfo?.gender ?? null,
    dateOfBirth: toDisplayDate(detail.personalInfo?.dateOfBirth),
    category: detail.personalInfo?.category ?? '',
    subcategory: detail.personalInfo?.subcategory ?? '',
    religion: detail.personalInfo?.religion ?? '',
    phone: detail.personalInfo?.phone ?? '',
    email: detail.personalInfo?.email ?? '',
    aadharNumber: detail.personalInfo?.aadharNumber ?? '',
    isGuardianExist: detail.isGuardianExist ?? false,
    guardianId: detail.guardianId ?? null,
    primaryGuardian: pgi?.primaryGuardian ?? 'father',
    linked: {
      father: !!pgi?.father?.isLinkedGuardian,
      mother: !!pgi?.mother?.isLinkedGuardian,
      guardian: !!pgi?.guardian?.isLinkedGuardian,
    },
    father: blockFrom(pgi?.father),
    mother: blockFrom(pgi?.mother),
    guardian: blockFrom(pgi?.guardian),
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
    documentName: detail.documents?.[0]?.documentName ?? '',
    additionalDetails: detail.additionalDetails ?? '',
  };
}

function buildPayload(form: FormState): AdmissionPayload {
  const payload: AdmissionPayload = {
    academicInfo: {
      year: form.academicYear || undefined,
      class: form.classId || undefined,
      rollNumber: val(form.rollNumber) ?? null,
    },
    personalInfo: {
      fullName: val(form.fullName),
      gender: (form.gender ?? 'Male') as GenderOption,
      dateOfBirth: val(parseDisplayDate(form.dateOfBirth) ?? form.dateOfBirth),
      category: val(form.category),
      subcategory: val(form.subcategory) ?? null,
      religion: val(form.religion),
      phone: val(form.phone),
      email: val(form.email),
      aadharNumber: val(form.aadharNumber),
    },
    isGuardianExist: form.isGuardianExist,
    parentGuardianInfo: {
      primaryGuardian: form.primaryGuardian,
      father: {
        name: val(form.father.name),
        phone: val(form.father.phone),
        email: val(form.father.email),
        occupation: val(form.father.occupation),
        aadharNumber: val(form.father.aadharNumber),
      },
      mother: {
        name: val(form.mother.name),
        phone: val(form.mother.phone),
        email: val(form.mother.email),
        occupation: val(form.mother.occupation),
        aadharNumber: val(form.mother.aadharNumber),
      },
      ...(form.primaryGuardian === 'other'
        ? {
            guardian: {
              name: val(form.guardian.name),
              phone: val(form.guardian.phone),
              email: val(form.guardian.email),
              occupation: val(form.guardian.occupation),
              aadharNumber: val(form.guardian.aadharNumber),
              relation: val(form.guardian.relation),
              mobileNumber: val(form.guardian.mobileNumber),
              address: val(form.guardian.address),
            },
          }
        : {}),
    },
    medicalDetails: { bloodGroup: val(form.bloodGroup), height: val(form.height), weight: val(form.weight) },
    bankDetails: {
      accountNumber: val(form.accountNumber),
      bankName: val(form.bankName),
      bankBranch: val(form.bankBranch),
      ifscCode: val(form.ifscCode),
    },
    previousSchoolDetails: { schoolName: val(form.prevSchoolName), address: val(form.prevSchoolAddress) },
    address: { currentAddress: val(form.currentAddress), permanentAddress: val(form.permanentAddress) },
    hostelDetails: { hostelName: val(form.hostelName) ?? null, roomNumber: val(form.roomNumber) ?? null },
    documents: form.documentName.trim() ? [{ documentName: form.documentName.trim() }] : undefined,
    additionalDetails: val(form.additionalDetails),
  };

  if (form.isGuardianExist && form.guardianId) {
    payload.guardianId = form.guardianId;
  }

  return payload;
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
  disabled,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  required?: boolean;
  isDate?: boolean;
  /** Read-only (e.g. a linked guardian whose details are edited from the guardian profile). */
  disabled?: boolean;
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
        editable={!disabled}
        style={[styles.input, multiline && styles.inputMultiline, disabled && styles.inputDisabled]}
      />
      )}
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
  const [files, setFiles] = useState<AdmissionFiles>({});
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(null);

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
            setForm(formFromDetail(detailRes));
            setExistingDocumentUrl(detailRes.documents?.[0]?.file ?? null);
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

  const setGuardianBlockField = (which: 'father' | 'mother' | 'guardian', key: keyof GuardianBlockForm, value: string) => {
    setForm((f) => ({ ...f, [which]: { ...f[which], [key]: value } }));
  };

  const setFile = (field: AdmissionFileField, part: AdmissionFilePart | null) => {
    setFiles((prev) => {
      const next = { ...prev };
      if (part) next[field] = part;
      else delete next[field];
      return next;
    });
  };

  const canSubmit = useMemo(
    () => !submitting && !!form.gender && !!form.classId && (!form.isGuardianExist || !!form.guardianId),
    [submitting, form.gender, form.classId, form.isGuardianExist, form.guardianId]
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
    if (form.isGuardianExist && !form.guardianId) {
      Alert.alert('Guardian required', 'Search and select the existing guardian, or turn the toggle off.');
      return;
    }
    if (form.dateOfBirth.trim() && !parseDisplayDate(form.dateOfBirth)) {
      Alert.alert('Invalid date', 'Enter the date of birth as dd/mm/yyyy.');
      return;
    }

    const digitsOnly = (s: string) => !s.trim() || /^\d+$/.test(s.trim());
    const phones = [form.phone, form.father.phone, form.mother.phone, form.guardian.phone, form.guardian.mobileNumber];
    const aadhars = [form.aadharNumber, form.father.aadharNumber, form.mother.aadharNumber, form.guardian.aadharNumber];
    if (!phones.every(digitsOnly)) {
      Alert.alert('Invalid phone number', 'Phone numbers must contain digits only.');
      return;
    }
    if (!aadhars.every((a) => digitsOnly(a) && a.trim().length <= 20)) {
      Alert.alert('Invalid Aadhar number', 'Aadhar numbers must contain digits only (max 20).');
      return;
    }

    const payload = buildPayload(form);
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const result = await createAdmission(payload, files);
        showToast('Application submitted');
        router.replace(`/admissions/${result.id}`);
      } else if (admissionId) {
        await updateAdmission(admissionId, payload, files);
        showToast('Changes saved');
        router.back();
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Could not save', message);
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
          <Field label="Roll Number" value={form.rollNumber} onChangeText={(t) => setField('rollNumber', t)} placeholder="Optional" />
          <Text style={styles.toggleHint}>The admission number is generated automatically when the application is approved.</Text>
        </SectionCard>

        <SectionCard title="Personal Info" icon="person-outline">
          <Field label="Full Name" value={form.fullName} onChangeText={(t) => setField('fullName', t)} placeholder="Student's full name" />
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
            isDate
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
          <Field label="Subcategory" value={form.subcategory} onChangeText={(t) => setField('subcategory', t)} />
          <Field label="Religion" value={form.religion} onChangeText={(t) => setField('religion', t)} />
          <Field label="Phone" value={form.phone} onChangeText={(t) => setField('phone', t)} keyboardType="phone-pad" />
          <Field label="Email" value={form.email} onChangeText={(t) => setField('email', t)} keyboardType="email-address" />
          <Field label="Aadhar Number" value={form.aadharNumber} onChangeText={(t) => setField('aadharNumber', t)} keyboardType="number-pad" />
        </SectionCard>

        <SectionCard title="Parent/Guardian Info" icon="people-outline">
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.fieldLabel}>Guardian already exists in system?</Text>
              <Text style={styles.toggleHint}>Turn on to link an existing guardian record instead of entering details below.</Text>
            </View>
            <Switch
              value={form.isGuardianExist}
              onValueChange={(v) => setField('isGuardianExist', v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
          {form.isGuardianExist ? <GuardianPicker value={form.guardianId} onChange={(id) => setField('guardianId', id)} /> : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Primary Guardian</Text>
            <ChipRow
              options={[
                { key: 'father' as PrimaryGuardianOption, label: 'Father' },
                { key: 'mother' as PrimaryGuardianOption, label: 'Mother' },
                { key: 'other' as PrimaryGuardianOption, label: 'Other' },
              ]}
              value={form.primaryGuardian}
              onChange={(v) => setField('primaryGuardian', v)}
            />
          </View>

          <Text style={styles.subHeading}>Father</Text>
          {form.linked.father ? <Text style={styles.linkedNote}>Linked guardian: edit these details from the guardian profile.</Text> : null}
          <Field label="Name" value={form.father.name} onChangeText={(t) => setGuardianBlockField('father', 'name', t)} disabled={form.linked.father} />
          <Field label="Phone" value={form.father.phone} onChangeText={(t) => setGuardianBlockField('father', 'phone', t)} keyboardType="phone-pad" disabled={form.linked.father} />
          <Field label="Email" value={form.father.email} onChangeText={(t) => setGuardianBlockField('father', 'email', t)} keyboardType="email-address" disabled={form.linked.father} />
          <Field label="Occupation" value={form.father.occupation} onChangeText={(t) => setGuardianBlockField('father', 'occupation', t)} disabled={form.linked.father} />
          <Field
            label="Aadhar Number"
            value={form.father.aadharNumber}
            onChangeText={(t) => setGuardianBlockField('father', 'aadharNumber', t)}
            keyboardType="number-pad"
            disabled={form.linked.father}
          />
          <ImagePickerField label="FATHER PHOTO" value={files.fatherPhoto ?? null} onChange={(p) => setFile('fatherPhoto', p)} />

          <Text style={styles.subHeading}>Mother</Text>
          {form.linked.mother ? <Text style={styles.linkedNote}>Linked guardian: edit these details from the guardian profile.</Text> : null}
          <Field label="Name" value={form.mother.name} onChangeText={(t) => setGuardianBlockField('mother', 'name', t)} disabled={form.linked.mother} />
          <Field label="Phone" value={form.mother.phone} onChangeText={(t) => setGuardianBlockField('mother', 'phone', t)} keyboardType="phone-pad" disabled={form.linked.mother} />
          <Field label="Email" value={form.mother.email} onChangeText={(t) => setGuardianBlockField('mother', 'email', t)} keyboardType="email-address" disabled={form.linked.mother} />
          <Field label="Occupation" value={form.mother.occupation} onChangeText={(t) => setGuardianBlockField('mother', 'occupation', t)} disabled={form.linked.mother} />
          <Field
            label="Aadhar Number"
            value={form.mother.aadharNumber}
            onChangeText={(t) => setGuardianBlockField('mother', 'aadharNumber', t)}
            keyboardType="number-pad"
            disabled={form.linked.mother}
          />
          <ImagePickerField label="MOTHER PHOTO" value={files.motherPhoto ?? null} onChange={(p) => setFile('motherPhoto', p)} />

          {form.primaryGuardian === 'other' ? (
            <>
              <Text style={styles.subHeading}>Guardian</Text>
              {form.linked.guardian ? <Text style={styles.linkedNote}>Linked guardian: edit these details from the guardian profile.</Text> : null}
              <Field label="Relation" value={form.guardian.relation} onChangeText={(t) => setGuardianBlockField('guardian', 'relation', t)} placeholder="e.g. Uncle" disabled={form.linked.guardian} />
              <Field label="Name" value={form.guardian.name} onChangeText={(t) => setGuardianBlockField('guardian', 'name', t)} disabled={form.linked.guardian} />
              <Field label="Phone" value={form.guardian.phone} onChangeText={(t) => setGuardianBlockField('guardian', 'phone', t)} keyboardType="phone-pad" disabled={form.linked.guardian} />
              <Field label="Email" value={form.guardian.email} onChangeText={(t) => setGuardianBlockField('guardian', 'email', t)} keyboardType="email-address" disabled={form.linked.guardian} />
              <Field label="Mobile Number" value={form.guardian.mobileNumber} onChangeText={(t) => setGuardianBlockField('guardian', 'mobileNumber', t)} keyboardType="phone-pad" disabled={form.linked.guardian} />
              <Field label="Occupation" value={form.guardian.occupation} onChangeText={(t) => setGuardianBlockField('guardian', 'occupation', t)} disabled={form.linked.guardian} />
              <Field label="Address" value={form.guardian.address} onChangeText={(t) => setGuardianBlockField('guardian', 'address', t)} multiline disabled={form.linked.guardian} />
              <Field
                label="Aadhar Number"
                value={form.guardian.aadharNumber}
                onChangeText={(t) => setGuardianBlockField('guardian', 'aadharNumber', t)}
                keyboardType="number-pad"
            disabled={form.linked.guardian}
              />
              <ImagePickerField label="GUARDIAN PHOTO" value={files.guardianPhoto ?? null} onChange={(p) => setFile('guardianPhoto', p)} />
            </>
          ) : null}
        </SectionCard>

        <SectionCard title="Medical Details" icon="medkit-outline">
          <Field label="Blood Group" value={form.bloodGroup} onChangeText={(t) => setField('bloodGroup', t)} placeholder="e.g. O+" />
          <Field label="Height" value={form.height} onChangeText={(t) => setField('height', t)} placeholder="e.g. 150cm" />
          <Field label="Weight" value={form.weight} onChangeText={(t) => setField('weight', t)} placeholder="e.g. 45kg" />
        </SectionCard>

        <SectionCard title="Bank Details" icon="card-outline">
          <Field label="Account Number" value={form.accountNumber} onChangeText={(t) => setField('accountNumber', t)} keyboardType="number-pad" />
          <Field label="Bank Name" value={form.bankName} onChangeText={(t) => setField('bankName', t)} />
          <Field label="Bank Branch" value={form.bankBranch} onChangeText={(t) => setField('bankBranch', t)} />
          <Field label="IFSC Code" value={form.ifscCode} onChangeText={(t) => setField('ifscCode', t.toUpperCase())} />
        </SectionCard>

        <SectionCard title="Previous School" icon="business-outline">
          <Field label="School Name" value={form.prevSchoolName} onChangeText={(t) => setField('prevSchoolName', t)} />
          <Field label="Address" value={form.prevSchoolAddress} onChangeText={(t) => setField('prevSchoolAddress', t)} multiline />
        </SectionCard>

        <SectionCard title="Address" icon="location-outline">
          <Field label="Current Address" value={form.currentAddress} onChangeText={(t) => setField('currentAddress', t)} multiline />
          <Field label="Permanent Address" value={form.permanentAddress} onChangeText={(t) => setField('permanentAddress', t)} multiline />
        </SectionCard>

        <SectionCard title="Documents" icon="document-text-outline">
          <View style={styles.imageGrid}>
            <ImagePickerField label="PROFILE PHOTO" value={files.profileImage ?? null} onChange={(p) => setFile('profileImage', p)} />
            <ImagePickerField label="AADHAR CARD" value={files.aadharImage ?? null} onChange={(p) => setFile('aadharImage', p)} />
            <ImagePickerField label="TRANSFER CERTIFICATE" value={files.tcImage ?? null} onChange={(p) => setFile('tcImage', p)} />
            <ImagePickerField
              label="BIRTH CERTIFICATE"
              value={files.birthCertificateImage ?? null}
              onChange={(p) => setFile('birthCertificateImage', p)}
            />
          </View>
          <Text style={styles.subHeading}>Supporting Document</Text>
          <Text style={styles.toggleHint}>
            Only one supporting document file can be attached — the name below is just for your records.
          </Text>
          <Field label="Document Name" value={form.documentName} onChangeText={(t) => setField('documentName', t)} placeholder="e.g. Caste certificate" />
          <ImagePickerField label="DOCUMENT FILE" value={files.documentFile ?? existingDocumentUrl} onChange={(p) => setFile('documentFile', p)} />
        </SectionCard>

        <SectionCard title="Additional Details" icon="create-outline">
          <Field
            label="Notes"
            value={form.additionalDetails}
            onChangeText={(t) => setField('additionalDetails', t)}
            multiline
            placeholder="Anything else worth noting"
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
  inputDisabled: { opacity: 0.6 },
  linkedNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
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
