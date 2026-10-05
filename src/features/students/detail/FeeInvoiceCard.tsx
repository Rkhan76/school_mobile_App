import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import type { StudentInvoice } from './studentDetail';
import { formatINR, SectionCard } from './ui';

export function downloadReceipt(inv: StudentInvoice) {
  Alert.alert('Download Receipt', `Receipt ${inv.receiptNo} PDF download coming soon.`);
}

export function InvoiceRow({ inv }: { inv: StudentInvoice }) {
  const color = inv.status === 'SUCCESS' ? colors.primaryDeep : inv.status === 'PENDING' ? colors.warning : colors.danger;
  return (
    <View style={styles.box}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{inv.title}</Text>
        <Text style={styles.sub}>Paid {inv.paidOn} via {inv.mode}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.amount}>{formatINR(inv.amount)}</Text>
        <Text style={[styles.status, { color }]}>{inv.status}</Text>
      </View>
    </View>
  );
}

export function FeeInvoiceCard({ inv }: { inv: StudentInvoice }) {
  return (
    <SectionCard icon="receipt-outline" title="Latest Fee Invoice" right={<Text style={styles.rec}>{inv.receiptNo}</Text>}>
      <InvoiceRow inv={inv} />
      <Pressable style={styles.btn} onPress={() => downloadReceipt(inv)}>
        <Ionicons name="download-outline" size={16} color={colors.primaryDeep} />
        <Text style={styles.btnText}>Download Receipt PDF</Text>
      </Pressable>
    </SectionCard>
  );
}

const styles = themed(() => StyleSheet.create({
  rec: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary },
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: radius.md, padding: 12 },
  title: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
  amount: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  status: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.4 },
  btn: { height: 42, borderRadius: radius.md, backgroundColor: colors.mintSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.primaryDeep },
}));
