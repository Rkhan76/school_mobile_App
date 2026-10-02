import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius } from '../../theme/tokens';
import { Field, FieldGrid, SectionCard } from './parts';
import type { ClassStatus, TeacherDetail } from './teacherDetail';

const statusMeta: Record<ClassStatus, { label: string; tone: 'success' | 'primary' | 'neutral' }> = {
  done: { label: 'Done', tone: 'neutral' },
  live: { label: 'Live', tone: 'success' },
  upcoming: { label: 'Upcoming', tone: 'primary' },
};

export function StatusChip({ status }: { status: ClassStatus }) {
  const m = statusMeta[status];
  return <Badge label={m.label} tone={m.tone} />;
}

export function DocumentRows({ docs }: { docs: TeacherDetail['documents'] }) {
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

export function OverviewTab({ t }: { t: TeacherDetail }) {
  const verified = t.documents.filter((d) => d.verified).length;
  return (
    <>
      <SectionCard icon="time-outline" title="Today's Classes" right={<Text style={styles.count}>{t.todaysClasses.length} periods</Text>}>
        <View style={styles.list}>
          {t.todaysClasses.map((c) => (
            <View key={c.id} style={[styles.classRow, c.status === 'live' && styles.classLive]}>
              <View style={styles.timeCol}>
                <Text style={styles.time}>{c.startTime}</Text>
                <Text style={styles.timeEnd}>{c.endTime}</Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.subject} numberOfLines={1}>{c.subject}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  Class {c.className}-{c.section} {'•'} {c.room}
                </Text>
              </View>
              <StatusChip status={c.status} />
            </View>
          ))}
        </View>
      </SectionCard>

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
          <Field label="Experience" value={`${t.experienceYears} yrs`} />
        </FieldGrid>
        <Field label="Qualification" value={t.qualification} />
      </SectionCard>

      <SectionCard icon="location-outline" title="Address">
        <AddressRow label="Current" value={t.addressInfo.current} />
        <AddressRow label="Permanent" value={t.addressInfo.permanent} />
      </SectionCard>

      <SectionCard icon="card-outline" title="Bank Details">
        <FieldGrid>
          <Field label="Account holder" value={t.bankDetails.accountHolder} />
          <Field label="Bank" value={t.bankDetails.bankName} />
          <View style={styles.monoField}>
            <Text style={styles.monoLabel}>ACCOUNT NUMBER</Text>
            <Text style={styles.monoValue}>{t.bankDetails.accountNumber}</Text>
          </View>
          <View style={styles.monoField}>
            <Text style={styles.monoLabel}>IFSC</Text>
            <Text style={styles.monoValue}>{t.bankDetails.ifsc}</Text>
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
  count: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary },
  classRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
  },
  classLive: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.mint },
  timeCol: { width: 48 },
  time: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  timeEnd: { fontFamily: fonts.mono, fontSize: 11, color: colors.textHint },
  classInfo: { flex: 1, gap: 2 },
  subject: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
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
});
