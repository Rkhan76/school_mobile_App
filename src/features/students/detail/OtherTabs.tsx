import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { colors, fonts, radius } from '../../../theme/tokens';
import { CheckInCard } from './CheckInCard';
import { DocumentsCard } from './DocumentsCard';
import { downloadReceipt, InvoiceRow } from './FeeInvoiceCard';
import { GuardianCard } from './GuardianCard';
import type { StudentDetail } from './studentDetail';
import { formatINR, LabelValue, SectionCard } from './ui';

const gap = { gap: 14 } as const;

export function GuardiansTab({ s }: { s: StudentDetail }) {
  return (
    <View style={gap}>
      {s.guardians.map((g) => (
        <GuardianCard key={g.email} g={g} title={g.isPrimary ? 'Primary Guardian' : 'Guardian'} />
      ))}
    </View>
  );
}

export function AttendanceTab({ s }: { s: StudentDetail }) {
  return (
    <View style={gap}>
      <CheckInCard a={s.attendance} />
      <SectionCard icon="calendar-outline" title="Recent Days">
        {s.attendance.recent.map((r) => (
          <View key={r.date} style={styles.line}>
            <Text style={styles.lineText}>{r.date}</Text>
            <Badge label={r.status} tone={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'danger'} />
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

export function FeesTab({ s }: { s: StudentDetail }) {
  return (
    <View style={gap}>
      <SectionCard icon="wallet-outline" title="Fee Summary">
        <View style={styles.two}>
          <LabelValue label="Total Paid" value={formatINR(s.fees.totalPaid)} />
          <LabelValue label="Total Due" value={formatINR(s.fees.totalDue)} />
        </View>
      </SectionCard>
      <SectionCard icon="receipt-outline" title="Payment History">
        {s.fees.history.map((inv) => (
          <Pressable key={inv.receiptNo} onPress={() => downloadReceipt(inv)}>
            <InvoiceRow inv={inv} />
          </Pressable>
        ))}
      </SectionCard>
    </View>
  );
}

export function BankTab({ s }: { s: StudentDetail }) {
  const b = s.bank;
  return (
    <SectionCard icon="business-outline" title="Bank Details">
      <View style={styles.two}>
        <LabelValue label="Account Holder" value={b.accountHolder} />
        <LabelValue label="Bank" value={b.bankName} />
      </View>
      <View style={styles.two}>
        <LabelValue label="Account No." value={b.accountNumber} mono />
        <LabelValue label="IFSC" value={b.ifsc} mono />
      </View>
      <LabelValue label="Branch" value={b.branch} />
    </SectionCard>
  );
}

export function HostelTab({ s }: { s: StudentDetail }) {
  const h = s.hostel;
  return (
    <SectionCard icon="bed-outline" title="Hostel" right={<Badge label={h.isResident ? 'Resident' : 'Day scholar'} tone={h.isResident ? 'primary' : 'neutral'} />}>
      <View style={styles.two}>
        <LabelValue label="Hostel" value={h.hostelName} />
        <LabelValue label="Room" value={h.room} />
      </View>
      <View style={styles.two}>
        <LabelValue label="Warden" value={h.warden} />
        <LabelValue label="Mess Plan" value={h.messPlan} />
      </View>
    </SectionCard>
  );
}

export function DocumentsTab({ s }: { s: StudentDetail }) {
  return <DocumentsCard docs={s.documents} title="All Documents" />;
}

const reportIcon = { Attendance: 'calendar-outline', Academic: 'school-outline', Fees: 'wallet-outline' } as const;

export function ReportsTab({ s }: { s: StudentDetail }) {
  return (
    <SectionCard icon="bar-chart-outline" title="Reports">
      {s.reports.map((r) => (
        <Pressable key={r.id} style={styles.report} onPress={() => Alert.alert(`${r.type} report`, `${r.range}\nDownload coming soon.`)}>
          <Ionicons name={reportIcon[r.type]} size={18} color={colors.primaryDeep} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.lineText}>{r.type} Report</Text>
            <View style={styles.range}>
              <Ionicons name="time-outline" size={11} color={colors.primaryDeep} />
              <Text style={styles.rangeText}>{r.range}</Text>
            </View>
          </View>
          <Ionicons name="download-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  lineText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.text },
  two: { flexDirection: 'row', gap: 12 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: radius.md, padding: 12 },
  range: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  rangeText: { fontFamily: fonts.monoMedium, fontSize: 10.5, color: colors.primaryDeep },
});
