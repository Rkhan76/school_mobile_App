import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { colors, fonts, themed } from '../../../theme/tokens';
import { MOCK_ATTENDANCE, MOCK_EXAMS, MOCK_FEE, MOCK_HOMEWORK } from './classDetail';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

function Row({ icon, title, sub, right }: { icon: IconName; title: string; sub: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={17} color={colors.primaryDeep} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
      </View>
      {right}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function Heading({ children }: { children: string }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function AttendanceTab({ sectionName }: { sectionName: string }) {
  const { present, absent, late } = MOCK_ATTENDANCE;
  const total = present + absent + late;
  const pct = total ? Math.round(((present + late) / total) * 100) : 0;
  return (
    <View style={styles.wrap}>
      <Card style={styles.pctCard}>
        <Text style={styles.pct}>{pct}%</Text>
        <Text style={styles.statLabel}>Today's attendance • {sectionName}</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      </Card>
      <View style={styles.statRow}>
        <Stat label="Present" value={String(present)} color={colors.success} />
        <Stat label="Absent" value={String(absent)} color={colors.danger} />
        <Stat label="Late" value={String(late)} color={colors.warning} />
      </View>
    </View>
  );
}

export function FeeTab() {
  const { collected, pending, dues } = MOCK_FEE;
  return (
    <View style={styles.wrap}>
      <View style={styles.statRow}>
        <Stat label="Collected" value={inr(collected)} color={colors.success} />
        <Stat label="Pending" value={inr(pending)} color={colors.danger} />
      </View>
      <Heading>Outstanding dues</Heading>
      <Card style={styles.list}>
        {dues.map((d) => (
          <Row key={d.student} icon="alert-circle-outline" title={d.student} sub={`Due ${d.dueDate}`} right={<Text style={styles.due}>{inr(d.amount)}</Text>} />
        ))}
      </Card>
    </View>
  );
}

export function ExamsTab() {
  const exams = MOCK_EXAMS;
  return (
    <Card style={styles.list}>
      {exams.map((e) => (
        <Row key={`${e.name}-${e.subject}`} icon="create-outline" title={`${e.name} • ${e.subject}`} sub={e.date} right={<Text style={styles.chip}>{e.marks} marks</Text>} />
      ))}
    </Card>
  );
}

export function HomeworkTab() {
  const homework = MOCK_HOMEWORK;
  return (
    <Card style={styles.list}>
      {homework.map((h) => (
        <Row key={h.title} icon="clipboard-outline" title={h.title} sub={`${h.subject} • Due ${h.dueDate}`} />
      ))}
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: 12 },
  list: { gap: 14, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  chip: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.primaryDeep, backgroundColor: colors.mint, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  due: { fontFamily: fonts.heading, fontSize: 14, color: colors.danger },
  heading: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', gap: 4, padding: 14 },
  statValue: { fontFamily: fonts.heading, fontSize: 20 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  pctCard: { alignItems: 'center', gap: 8 },
  pct: { fontFamily: fonts.headingExtra, fontSize: 38, color: colors.primaryDeep },
  bar: { alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: colors.mint, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
}));
