import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius } from '../../theme/tokens';
import { Field, FieldGrid, SectionCard } from './parts';
import type { EmploymentHistoryRow, TeacherDetail } from './teacherDetail';

export function DocumentRows({ docs }: { docs: TeacherDetail['documents'] }) {
  if (docs.length === 0) {
    return <Text style={styles.empty}>No documents on file.</Text>;
  }
  return (
    <View style={styles.list}>
      {docs.map((d) => (
        <View key={d.id} style={styles.docRow}>
          <Ionicons name="document-text-outline" size={18} color={colors.primaryDeep} />
          <Text style={styles.docName} numberOfLines={1}>{d.name}</Text>
          <Badge label={d.verified ? 'Verified' : 'Pending'} tone={d.verified ? 'success' : 'warning'} />
        </View>
      ))}
    </View>
  );
}

function formatHistoryDate(value?: string | null): string {
  if (!value) return 'Present';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function EmploymentHistorySection({
  history,
  loading,
  onLoad,
}: {
  history: EmploymentHistoryRow[] | null;
  loading: boolean;
  onLoad: () => void;
}) {
  return (
    <SectionCard icon="briefcase-outline" title="Employment History">
      {history === null ? (
        <Pressable style={styles.loadBtn} onPress={onLoad} disabled={loading} accessibilityLabel="Load employment history">
          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryDeep} />
          ) : (
            <>
              <Ionicons name="time-outline" size={16} color={colors.primaryDeep} />
              <Text style={styles.loadBtnText}>Show past designations</Text>
            </>
          )}
        </Pressable>
      ) : history.length === 0 ? (
        <Text style={styles.empty}>No prior designation changes on record.</Text>
      ) : (
        <View style={styles.list}>
          {history.map((h, i) => (
            <View key={h.id ?? i} style={styles.historyRow}>
              <View style={styles.grow}>
                <Text style={styles.historyTitle}>{h.designation ?? '—'}{h.department ? ` • ${h.department}` : ''}</Text>
                <Text style={styles.historyMeta}>
                  {formatHistoryDate(h.effectiveFrom ?? h.startDate)} – {formatHistoryDate(h.effectiveTo ?? h.endDate)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

export function OverviewTab({
  t,
  employmentHistory,
  employmentHistoryLoading,
  onLoadEmploymentHistory,
}: {
  t: TeacherDetail;
  employmentHistory: EmploymentHistoryRow[] | null;
  employmentHistoryLoading: boolean;
  onLoadEmploymentHistory: () => void;
}) {
  const verified = t.documents.filter((d) => d.verified).length;
  return (
    <>
      <SectionCard icon="person-outline" title="Personal & Employment">
        <FieldGrid>
          <Field label="Date of birth" value={t.dateOfBirth} />
          <Field label="Gender" value={t.gender} />
          <Field label="Marital status" value={t.maritalStatus} />
          <Field label="Father's name" value={t.fathersName} />
          <Field label="Mother's name" value={t.mothersName} />
          <Field label="Joining date" value={t.joiningDate} />
          <Field label="Contract type" value={t.contractType} />
          <Field label="Shift" value={t.shift} />
          <Field label="Work location" value={t.workLocation} />
          <Field label="Experience" value={t.experience} />
          {t.designation ? <Field label="Designation" value={t.designation} /> : null}
          {t.department ? <Field label="Department" value={t.department} /> : null}
        </FieldGrid>
        <Field label="Qualification" value={t.qualification} />
      </SectionCard>

      <SectionCard icon="location-outline" title="Address">
        <AddressRow label="Current" value={t.addressInfo.current || '—'} />
        <AddressRow label="Permanent" value={t.addressInfo.permanent || '—'} />
      </SectionCard>

      <SectionCard icon="card-outline" title="Bank Details">
        <FieldGrid>
          <Field label="Bank" value={t.bankDetails.bankName || '—'} />
          <View style={styles.monoField}>
            <Text style={styles.monoLabel}>ACCOUNT NUMBER</Text>
            <Text style={styles.monoValue}>{t.bankDetails.accountNumber || '—'}</Text>
          </View>
          <View style={styles.monoField}>
            <Text style={styles.monoLabel}>IFSC</Text>
            <Text style={styles.monoValue}>{t.bankDetails.ifscCode || '—'}</Text>
          </View>
        </FieldGrid>
      </SectionCard>

      <SectionCard
        icon="shield-checkmark-outline"
        title="Documents"
        right={<Text style={styles.count}>{verified} of {t.documents.length}</Text>}
      >
        <DocumentRows docs={t.documents} />
      </SectionCard>

      <EmploymentHistorySection
        history={employmentHistory}
        loading={employmentHistoryLoading}
        onLoad={onLoadEmploymentHistory}
      />
    </>
  );
}

function AddressRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.addrRow}>
      <Ionicons name="location" size={16} color={colors.primaryDeep} style={styles.pin} />
      <View style={styles.addrText}>
        <Text style={styles.addrLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.addrValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  grow: { flex: 1, gap: 2 },
  count: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary },
  empty: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textHint },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
  },
  docName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  addrRow: { flexDirection: 'row', gap: 8 },
  pin: { marginTop: 2 },
  addrText: { flex: 1, gap: 2 },
  addrLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.6, color: colors.textHint },
  addrValue: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, lineHeight: 19 },
  monoField: { width: '50%', paddingRight: 8, gap: 2 },
  monoLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.6, color: colors.textHint },
  monoValue: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  loadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42,
    borderRadius: radius.md, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
  },
  loadBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
  },
  historyTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  historyMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
});
