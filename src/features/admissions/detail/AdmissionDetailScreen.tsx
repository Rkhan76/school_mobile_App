import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { ScreenBackground } from '../../../components/ui/Screen';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { showToast } from '../../../components/ui/Toast';
import { ApiError } from '../../../lib/apiClient';
import { formatDate as sharedFormatDate, formatDateTime as sharedFormatDateTime } from '../../../lib/date';
import { colors, fonts, radius, shadow, themed } from '../../../theme/tokens';
import { useSession } from '../../auth/session';
import { approveAdmission, cancelAdmission, deleteAdmission, getAdmission, rejectAdmission } from '../api';
import { RejectModal } from '../RejectModal';
import { ApplicantDocuments } from './ApplicantDocuments';
import type { AdmissionDetail, AdmissionStatus, GuardianBlock } from '../types';
import { hScrollFixed } from '../../../components/ui/scrollStyles';

type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'primary';

const STATUS: Record<AdmissionStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'primary' },
  enrolled: { label: 'Enrolled', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Busy = 'approve' | 'reject' | 'cancel' | 'delete' | null;

function formatDate(value?: string | null): string | undefined {
  return value ? sharedFormatDate(value) : undefined;
}

function formatDateTime(value?: string | null): string | undefined {
  return value ? sharedFormatDateTime(value) : undefined;
}

function isBlank(v: unknown): boolean {
  return v === undefined || v === null || v === '';
}

/** True if the object has at least one non-empty field — gates whether to render a section at all. */
function hasAny(obj?: Record<string, unknown> | null): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => !isBlank(v));
}

function Section({ icon, title, right, children }: { icon: IconName; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={16} color={colors.primaryDeep} />
        </View>
        <Text style={styles.sectionTitle} numberOfLines={1}>{title}</Text>
        {right}
      </View>
      {children}
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (isBlank(value)) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon, label, tone, onPress, disabled, loading,
}: { icon: IconName; label: string; tone: 'primary' | 'success' | 'danger' | 'warning' | 'neutral'; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const palette: Record<typeof tone, { bg: string; fg: string }> = {
    primary: { bg: colors.mint, fg: colors.primaryDeep },
    success: { bg: colors.successBg, fg: colors.success },
    danger: { bg: colors.dangerBg, fg: colors.danger },
    warning: { bg: colors.warningBg, fg: colors.warning },
    neutral: { bg: colors.mintSoft, fg: colors.textSecondary },
  };
  const p = palette[tone];
  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: p.bg }, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
    >
      {loading ? <ActivityIndicator size="small" color={p.fg} /> : <Ionicons name={icon} size={16} color={p.fg} />}
      <Text style={[styles.actionBtnText, { color: p.fg }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function CenteredMessage({ icon, title, sub, actionLabel, onAction }: { icon: IconName; title: string; sub?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.centeredWrap}>
      <Card style={styles.centeredCard}>
        <Ionicons name={icon} size={40} color={colors.textHint} />
        <Text style={styles.centeredTitle}>{title}</Text>
        {sub ? <Text style={styles.centeredSub}>{sub}</Text> : null}
        {actionLabel && onAction ? (
          <Pressable style={styles.retryBtn} onPress={onAction}>
            <Text style={styles.retryText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </Card>
    </View>
  );
}

function guardianLabel(block: GuardianBlock, role: 'father' | 'mother' | 'guardian'): string {
  if (block.name) return block.name;
  return role === 'father' ? 'Father' : role === 'mother' ? 'Mother' : 'Guardian';
}

function GuardianSection({ role, title, block, isPrimary }: {
  role: 'father' | 'mother' | 'guardian';
  title: string;
  block: (GuardianBlock & { isLinkedGuardian?: boolean }) | undefined;
  isPrimary: boolean;
}) {
  if (!block || !hasAny(block as Record<string, unknown>)) return null;
  return (
    <Section
      icon="person-outline"
      title={title}
      right={
        <View style={styles.sectionBadges}>
          {isPrimary ? <Badge label="Primary" tone="primary" /> : null}
          {block.isLinkedGuardian ? <Badge label="Linked guardian" tone="success" /> : null}
        </View>
      }
    >
      <View style={styles.guardianTop}>
        {block.photo ? (
          <Image source={{ uri: block.photo }} style={styles.guardianPhoto} />
        ) : (
          <Avatar name={guardianLabel(block, role)} size={44} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.guardianName} numberOfLines={1}>{guardianLabel(block, role)}</Text>
          {block.occupation ? <Text style={styles.guardianOcc} numberOfLines={1}>{block.occupation}</Text> : null}
        </View>
      </View>
      <Row label="Relation" value={block.relation} />
      <Row label="Phone" value={block.phone ?? block.mobileNumber} />
      <Row label="Email" value={block.email} />
      <Row label="Aadhar Number" value={block.aadharNumber} />
      <Row label="Address" value={block.address} />
      {block.isLinkedGuardian ? (
        <Text style={styles.linkedNote}>These details come from the guardian’s profile. Edit them there.</Text>
      ) : null}
    </Section>
  );
}

export function AdmissionDetailScreen({ id }: { id: string | undefined }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);

  const [data, setData] = useState<AdmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAdmission(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Something went wrong.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const can = useCallback((perm: string) => permissions.includes(perm), [permissions]);

  const doApprove = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Approve application',
      "This will immediately create the student's portal login and enroll them. Continue?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setBusy('approve');
            try {
              const updated = await approveAdmission(id);
              setData(updated);
              showToast('Application approved');
            } catch (err) {
              Alert.alert('Could not approve', err instanceof Error ? err.message : 'Something went wrong.');
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }, [id]);

  const doReject = useCallback(async (reason: string) => {
    if (!id) return;
    setBusy('reject');
    try {
      const updated = await rejectAdmission(id, reason);
      setData(updated);
      setRejectOpen(false);
      showToast('Application rejected');
    } catch (err) {
      Alert.alert('Could not reject', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }, [id]);

  const doCancel = useCallback(() => {
    if (!id) return;
    Alert.alert('Cancel application', 'Cancel this application? This cannot be undone.', [
      { text: 'Back', style: 'cancel' },
      {
        text: 'Cancel Application',
        style: 'destructive',
        onPress: async () => {
          setBusy('cancel');
          try {
            const updated = await cancelAdmission(id);
            setData(updated);
            showToast('Application cancelled');
          } catch (err) {
            Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Something went wrong.');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  }, [id]);

  const runDelete = useCallback(() => {
    if (!id || !data) return;
    Alert.alert('Delete application', `Delete ${data.applicationNumber}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          try {
            await deleteAdmission(id);
            showToast('Application deleted');
            router.back();
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Something went wrong.');
            setBusy(null);
          }
        },
      },
    ]);
  }, [id, data, router]);

  const doDelete = useCallback(() => {
    if (!data) return;
    if (data.status !== 'pending') {
      Alert.alert(
        'Delete non-pending application',
        `This application is already ${data.status}. Deleting it is permanent and cannot be undone — the student record it created will NOT be affected. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'destructive', onPress: runDelete },
        ],
      );
    } else {
      runDelete();
    }
  }, [data, runDelete]);

  if (!id || (error && error instanceof ApiError && error.statusCode === 404)) {
    return (
      <ScreenBackground>
        <ScreenHeader title="Admission" back />
        <CenteredMessage icon="document-outline" title="Admission not found" sub="This application may have been removed." />
      </ScreenBackground>
    );
  }

  if (loading) {
    return (
      <ScreenBackground>
        <ScreenHeader title="Admission" back />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  if (error || !data) {
    return (
      <ScreenBackground>
        <ScreenHeader title="Admission" back />
        <CenteredMessage
          icon="alert-circle-outline"
          title="Couldn't load this application"
          sub={error?.message}
          actionLabel="Retry"
          onAction={fetchDetail}
        />
      </ScreenBackground>
    );
  }

  const st = STATUS[data.status];
  // Some records come back without personalInfo; render them with blanks instead of crashing.
  const personal: Partial<AdmissionDetail['personalInfo']> = data.personalInfo ?? {};
  const name = personal.fullName || 'Admission';
  const subtitle = data.status === 'enrolled' ? data.admissionNumber ?? data.applicationNumber : data.applicationNumber;
  const rollNumber = data.rollNumber ?? data.academicInfo?.rollNumber;

  const primaryGuardian = data.parentGuardianInfo?.primaryGuardian === 'other' ? 'guardian' : data.parentGuardianInfo?.primaryGuardian;

  const personalRows: { label: string; value?: string | null }[] = [
    { label: 'Gender', value: personal.gender },
    { label: 'Date of Birth', value: formatDate(personal.dateOfBirth) },
    { label: 'Category', value: personal.category },
    { label: 'Subcategory', value: personal.subcategory },
    { label: 'Religion', value: personal.religion },
    { label: 'Phone', value: personal.phone },
    { label: 'Email', value: personal.email },
    { label: 'Aadhar Number', value: personal.aadharNumber },
  ];

  // Uploaded student documents (aadhar / TC / birth certificate) are listed with the supporting documents.
  const imageDocs = [
    { documentName: 'Aadhar Card', file: data.aadharImage },
    { documentName: 'Transfer Certificate', file: data.tcImage },
    { documentName: 'Birth Certificate', file: data.birthCertificateImage },
  ].filter((d) => !!d.file);
  const documents = [...imageDocs, ...(data.documents ?? [])];

  return (
    <ScreenBackground>
      <ScreenHeader title={name} subtitle={subtitle ?? undefined} back />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            {data.profileImage ? (
              <Image source={{ uri: data.profileImage }} style={styles.profilePhoto} />
            ) : (
              <Avatar name={name} size={64} />
            )}
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              <View style={styles.badgeRow}>
                <Badge label={st.label} tone={st.tone} />
                {data.applicationNumber ? (
                  <View style={styles.appNoTag}>
                    <Text style={styles.appNoText}>{data.applicationNumber}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {data.status === 'rejected' && (data.rejectionReason || data.rejectedAt) ? (
            <View style={[styles.noticeBox, { backgroundColor: colors.dangerBg }]}>
              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
              <View style={{ flex: 1 }}>
                {data.rejectionReason ? <Text style={[styles.noticeText, { color: colors.danger }]}>{data.rejectionReason}</Text> : null}
                {data.rejectedAt ? <Text style={styles.noticeSub}>{formatDateTime(data.rejectedAt)}</Text> : null}
              </View>
            </View>
          ) : null}

          {(data.status === 'approved' || data.status === 'enrolled') && data.approvedAt ? (
            <View style={[styles.noticeBox, { backgroundColor: colors.successBg }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.noticeSub}>Approved on {formatDateTime(data.approvedAt)}</Text>
            </View>
          ) : null}

          {data.status === 'cancelled' && data.cancelledAt ? (
            <View style={[styles.noticeBox, { backgroundColor: colors.neutralBg }]}>
              <Ionicons name="ban-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.noticeSub}>Cancelled on {formatDateTime(data.cancelledAt)}</Text>
            </View>
          ) : null}
        </Card>

        <Section icon="person-circle-outline" title="Personal Information">
          {personalRows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
        </Section>

        {(data.className || data.sectionName || data.yearName || rollNumber) && (
          <Section icon="school-outline" title="Academic Information">
            <Row label="Class" value={data.className} />
            <Row label="Section" value={data.sectionName} />
            <Row label="Year" value={data.yearName} />
            <Row label="Roll Number" value={rollNumber} />
          </Section>
        )}

        <GuardianSection role="father" title="Father" block={data.fatherInfo ?? data.parentGuardianInfo?.father} isPrimary={primaryGuardian === 'father'} />
        <GuardianSection role="mother" title="Mother" block={data.motherInfo ?? data.parentGuardianInfo?.mother} isPrimary={primaryGuardian === 'mother'} />
        <GuardianSection role="guardian" title="Guardian" block={data.guardianInfo ?? data.parentGuardianInfo?.guardian} isPrimary={primaryGuardian === 'guardian'} />

        {hasAny(data.medicalDetails) && (
          <Section icon="medkit-outline" title="Medical Details">
            <Row label="Blood Group" value={data.medicalDetails?.bloodGroup} />
            <Row label="Height" value={data.medicalDetails?.height} />
            <Row label="Weight" value={data.medicalDetails?.weight} />
          </Section>
        )}

        {hasAny(data.bankDetails) && (
          <Section icon="business-outline" title="Bank Details">
            <Row label="Account Number" value={data.bankDetails?.accountNumber} />
            <Row label="Bank Name" value={data.bankDetails?.bankName} />
            <Row label="Branch" value={data.bankDetails?.bankBranch} />
            <Row label="IFSC Code" value={data.bankDetails?.ifscCode} />
          </Section>
        )}

        {hasAny(data.previousSchoolDetails) && (
          <Section icon="library-outline" title="Previous School">
            <Row label="School Name" value={data.previousSchoolDetails?.schoolName} />
            <Row label="Address" value={data.previousSchoolDetails?.address} />
          </Section>
        )}

        {hasAny(data.address) && (
          <Section icon="location-outline" title="Address">
            <Row label="Current Address" value={data.address?.currentAddress} />
            <Row label="Permanent Address" value={data.address?.permanentAddress} />
          </Section>
        )}

        {(data.status === 'pending' || data.status === 'approved') && (can('entity-document.record.create') || can('entity-document.record.read')) ? <ApplicantDocuments admissionId={data.id} canView={can('entity-document.record.read')} canUpload={can('entity-document.record.create')} /> : null}

        {documents.length > 0 && (
          <Section icon="document-text-outline" title="Documents">
            <View style={{ gap: 8 }}>
              {documents.map((doc, i) => (
                <View key={`${doc.documentName}-${i}`} style={styles.docRow}>
                  <Ionicons name="document-outline" size={18} color={colors.primaryDeep} />
                  <Text style={styles.docName} numberOfLines={1}>{doc.documentName}</Text>
                  {doc.file ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => Linking.openURL(doc.file as string).catch(() => Alert.alert('Unable to open document'))}
                      accessibilityLabel={`View ${doc.documentName}`}
                    >
                      <Ionicons name="open-outline" size={18} color={colors.primaryDeep} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          </Section>
        )}

        {data.additionalDetails ? (
          <Section icon="information-circle-outline" title="Additional Details">
            <Text style={styles.freeText}>{data.additionalDetails}</Text>
          </Section>
        ) : null}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        <ScrollView horizontal style={hScrollFixed} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
          {data.status === 'pending' && can('admission.application.update') && (
            <ActionButton icon="create-outline" label="Edit" tone="neutral" onPress={() => router.push(`/admissions/${id}/edit`)} disabled={busy !== null} />
          )}
          {data.status === 'pending' && can('admission.approval.update') && (
            <ActionButton icon="checkmark-circle-outline" label="Approve" tone="success" onPress={doApprove} disabled={busy !== null} loading={busy === 'approve'} />
          )}
          {data.status === 'pending' && can('admission.rejection.update') && (
            <ActionButton icon="close-circle-outline" label="Reject" tone="danger" onPress={() => setRejectOpen(true)} disabled={busy !== null} />
          )}
          {data.status === 'pending' && can('admission.cancellation.update') && (
            <ActionButton icon="ban-outline" label="Cancel" tone="warning" onPress={doCancel} disabled={busy !== null} loading={busy === 'cancel'} />
          )}
          {can('admission.application.delete') && (
            <ActionButton icon="trash-outline" label="Delete" tone="danger" onPress={doDelete} disabled={busy !== null} loading={busy === 'delete'} />
          )}
        </ScrollView>
      </View>

      <RejectModal
        visible={rejectOpen}
        count={1}
        onClose={() => setRejectOpen(false)}
        onSubmit={doReject}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centeredWrap: { flex: 1, paddingHorizontal: 16, justifyContent: 'center' },
  centeredCard: { alignItems: 'center', gap: 8, paddingVertical: 36 },
  centeredTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  centeredSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { marginTop: 8, height: 44, paddingHorizontal: 20, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },

  profileCard: { gap: 12 },
  profilePhoto: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.mint },
  guardianPhoto: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mint },
  linkedNote: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textSecondary, marginTop: 4 },
  profileTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  name: { fontFamily: fonts.headingExtra, fontSize: 20, color: colors.text },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  appNoTag: { backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  appNoText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  noticeBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: radius.md },
  noticeText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  noticeSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },

  section: { padding: 16, gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  sectionBadges: { flexDirection: 'row', gap: 6 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 2 },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  rowValue: { flex: 1, textAlign: 'right', fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },

  guardianTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  guardianName: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  guardianOcc: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textSecondary },

  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: radius.md, paddingHorizontal: 12, height: 46 },
  docName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },

  freeText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.text, lineHeight: 20 },

  actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10, backgroundColor: colors.backgroundGlass, borderTopWidth: 1, borderTopColor: colors.border, ...shadow.card },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 16, borderRadius: radius.lg },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { fontFamily: fonts.bodySemi, fontSize: 13.5 },
}));
