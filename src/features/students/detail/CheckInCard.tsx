import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { colors, fonts, radius } from '../../../theme/tokens';
import type { StudentAttendance } from './studentDetail';
import { SectionCard } from './ui';

export function CheckInCard({ a }: { a: StudentAttendance }) {
  const total = Math.max(a.present + a.absent + a.late, 1);
  const tone = a.todayStatus === 'PRESENT' ? 'success' : a.todayStatus === 'LATE' ? 'warning' : 'danger';
  return (
    <SectionCard icon="radio-outline" title="Today's Check-in" right={<Badge label={a.todayStatus} tone={tone} />}>
      <View style={styles.box}>
        <Ionicons name="finger-print" size={22} color={colors.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.time}>{a.checkInTime} • {a.checkInPlace}</Text>
          <Text style={styles.src}>{a.checkInSource}</Text>
        </View>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primaryDeep} />
      </View>
      <View style={styles.pctRow}>
        <Text style={styles.pctLabel}>Current Month ({a.monthDays} Days)</Text>
        <Text style={styles.pctValue}>{a.punctualityPct}% punctuality</Text>
      </View>
      <View style={styles.bar}>
        <View style={{ flex: a.present / total, backgroundColor: colors.primaryDeep }} />
        <View style={{ flex: a.late / total, backgroundColor: colors.warning }} />
        <View style={{ flex: a.absent / total, backgroundColor: colors.danger }} />
      </View>
      <View style={styles.legend}>
        <Legend color={colors.primaryDeep} text={`${a.present} Present`} />
        <Legend color={colors.danger} text={`${a.absent} Absent`} />
        <Legend color={colors.text} text={`${a.late} Tardy/Late`} />
      </View>
    </SectionCard>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.leg}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.mintSoft, borderRadius: radius.md, padding: 12 },
  time: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  src: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
  pctRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pctLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  pctValue: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.mint },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legText: { fontFamily: fonts.monoMedium, fontSize: 11 },
});
