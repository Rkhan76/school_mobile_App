import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { formatINR } from './format';
import type { CashflowData } from './mockData';

function MiniBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <View style={styles.bars}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            backgroundColor: color,
            opacity: 0.35 + 0.65 * (i / data.length),
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

export function CashflowCard({ data }: { data: CashflowData }) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>Institutional Cashflow</Text>
          <Text style={styles.sub}>Academic Year {data.academicYear}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Avg: {data.avgCollectedPct}% collected</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: colors.mint }]}>
          <View style={styles.boxTop}>
            <Text style={[styles.tag, { color: colors.primaryDeep }]}>RECEIVED</Text>
            <Ionicons name="arrow-up-outline" size={14} color={colors.primary} style={styles.rot} />
          </View>
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>{formatINR(data.received)}</Text>
          <Text style={styles.caption}>{data.receivedStudents} Students settled</Text>
          <MiniBars data={data.receivedBars} color={colors.primary} />
        </View>
        <View style={[styles.box, { backgroundColor: '#fdeceb' }]}>
          <View style={styles.boxTop}>
            <Text style={[styles.tag, { color: colors.danger }]}>PENDING</Text>
            <Text style={styles.bang}>!</Text>
          </View>
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>{formatINR(data.pending)}</Text>
          <Text style={styles.caption}>{data.pendingInvoices} Invoices overdue</Text>
          <MiniBars data={data.pendingBars} color={colors.danger} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  headText: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pill: { backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontFamily: fonts.monoMedium, fontSize: 10, color: colors.primaryDeep },
  row: { flexDirection: 'row', gap: 10 },
  box: { flex: 1, borderRadius: radius.lg, padding: 12, gap: 4 },
  boxTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8 },
  rot: { transform: [{ rotate: '45deg' }] },
  bang: { fontFamily: fonts.heading, fontSize: 14, color: colors.danger },
  amount: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.text },
  caption: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 28, marginTop: 6 },
});
