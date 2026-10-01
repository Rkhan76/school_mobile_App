import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius } from '../../theme/tokens';
import { BottomSheet, Button, Row } from './parts';
import { formatDate, formatINR, isOverdue, statusTone, type Invoice } from './mockFees';

type Props = { invoice: Invoice | null; onClose: () => void; onCollect: (inv: Invoice) => void };

/** Bottom sheet: invoice line items + payments history. */
export function InvoiceDetailSheet({ invoice: i, onClose, onCollect }: Props) {
  return (
    <BottomSheet visible={i !== null} onClose={onClose} tall>
      {i ? (
        <>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.no}>{i.invoiceNo}</Text>
              <Text style={styles.sub}>{i.studentName} · {i.className} · {i.period}</Text>
            </View>
            <Badge label={i.status} tone={statusTone(i.status)} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            <Row label="Due date" value={formatDate(i.dueDate)} tone={isOverdue(i) ? colors.danger : undefined} />

            <View style={styles.block}>
              <Text style={styles.section}>Line items</Text>
              {i.items.map((it) => <Row key={it.name} label={it.name} value={formatINR(it.amount)} />)}
              <View style={styles.sep} />
              <Row label="Total" value={formatINR(i.total)} />
              <Row label="Paid" value={formatINR(i.paid)} tone={colors.success} />
              <Row label="Outstanding" value={formatINR(i.outstanding)} tone={i.outstanding > 0 ? colors.danger : undefined} />
            </View>

            <View style={styles.block}>
              <Text style={styles.section}>Payments history</Text>
              {i.payments.length === 0 ? (
                <Text style={styles.none}>No payments recorded yet.</Text>
              ) : (
                i.payments.map((p) => (
                  <View key={p.id} style={styles.pay}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.receipt}>{p.receiptNo}</Text>
                      <Text style={styles.sub}>
                        {formatDate(p.date)} · {p.mode}{p.reference ? ` · ${p.reference}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.payAmt}>{formatINR(p.amount)}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Button label="Close" variant="soft" flex onPress={onClose} />
            {i.outstanding > 0 ? <Button label="Collect" icon="card-outline" flex onPress={() => onCollect(i)} /> : null}
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  no: { fontFamily: fonts.monoMedium, fontSize: 17, color: colors.primaryDeep },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  block: { gap: 8, backgroundColor: colors.mintSoft, borderRadius: radius.lg, padding: 14 },
  section: { fontFamily: fonts.heading, fontSize: 14, color: colors.text, marginBottom: 2 },
  sep: { height: 1, backgroundColor: colors.border },
  none: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  pay: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receipt: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  payAmt: { fontFamily: fonts.heading, fontSize: 14, color: colors.success },
  actions: { flexDirection: 'row', gap: 10 },
});
