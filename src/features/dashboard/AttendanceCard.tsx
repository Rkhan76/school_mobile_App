import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import type { AttendanceData } from './mockData';

const C = { present: colors.primaryDeep, absent: colors.danger, late: '#9ca3af', half: '#7fd1c7' } as const;

export function AttendanceCard({ data }: { data: AttendanceData }) {
  const segs = [
    { key: 'Present', n: data.present, color: C.present },
    { key: 'Absent', n: data.absent, color: C.absent },
    { key: 'Late', n: data.late, color: C.late },
    { key: 'Half Day', n: data.halfDay, color: C.half },
  ];
  const total = segs.reduce((s, x) => s + x.n, 0) || 1;
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>Today's Attendance</Text>
          <Text style={styles.sub}>Live student tracking • {data.enrolled} enrolled</Text>
        </View>
        <View style={styles.rateBox}>
          <Text style={styles.rate}>{data.rate}%</Text>
          <Text style={styles.status}>{data.status}</Text>
        </View>
      </View>
      <View style={styles.bar}>
        {segs.map((s) => (
          <View key={s.key} style={{ flex: s.n / total, backgroundColor: s.color }} />
        ))}
      </View>
      <View style={styles.legend}>
        {segs.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.key} </Text>
            <Text style={styles.legendNum}>{s.n}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  headText: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rateBox: { alignItems: 'flex-end' },
  rate: { fontFamily: fonts.headingExtra, fontSize: 28, color: colors.primary, lineHeight: 32 },
  status: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  bar: { flexDirection: 'row', height: 12, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendText: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  legendNum: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.text },
});
