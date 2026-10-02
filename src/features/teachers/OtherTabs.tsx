import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius } from '../../theme/tokens';
import { DocumentRows } from './OverviewTab';
import { SectionCard } from './parts';
import {
  formatINR,
  type AttendanceDayStatus,
  type TeacherDetail,
  type Weekday,
} from './teacherDetail';

export function SubjectsTab({ t }: { t: TeacherDetail }) {
  return (
    <SectionCard icon="library-outline" title="Assigned Classes" right={<Text style={s.mono}>{t.assignments.length} total</Text>}>
      <View style={s.list}>
        {t.assignments.map((a) => (
          <View key={a.id} style={s.row}>
            <View style={s.classBox}>
              <Text style={s.classBoxText}>{a.className}-{a.section}</Text>
            </View>
            <View style={s.grow}>
              <Text style={s.rowTitle}>Class {a.className}-{a.section} {'—'} {a.subject}</Text>
              <Text style={s.rowMeta}>{a.periodsPerWeek} periods / week</Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TimetableTab({ t }: { t: TeacherDetail }) {
  const [day, setDay] = useState<Weekday>('Mon');
  const periods = t.timetable[day];
  return (
    <SectionCard icon="calendar-outline" title="Weekly Timetable">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayRow}>
        {DAYS.map((d) => (
          <Pressable key={d} onPress={() => setDay(d)} style={[s.dayChip, d === day && s.dayChipOn]}>
            <Text style={[s.dayText, d === day && s.dayTextOn]}>{d}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.list}>
        {periods.map((p) => (
          <View key={p.id} style={s.row}>
            <View style={s.periodBox}>
              <Text style={s.periodLabel}>P{p.period}</Text>
            </View>
            <View style={s.grow}>
              <Text style={s.rowTitle}>{p.subject} {'•'} {p.classSection}</Text>
              <Text style={s.rowMeta}>{p.startTime} - {p.endTime} {'•'} {p.room}</Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const dayColor: Record<AttendanceDayStatus, { bg: string; fg: string }> = {
  P: { bg: colors.successBg, fg: colors.success },
  A: { bg: colors.dangerBg, fg: colors.danger },
  L: { bg: colors.warningBg, fg: colors.warning },
  H: { bg: '#eef2f1', fg: colors.textHint },
};

export function AttendanceTab({ t }: { t: TeacherDetail }) {
  const a = t.attendance;
  return (
    <SectionCard icon="checkmark-done-outline" title={a.monthLabel} right={<Text style={s.mono}>{a.percentage}%</Text>}>
      <View style={s.countRow}>
        <Count label="Present" value={a.present} color={colors.success} />
        <Count label="Absent" value={a.absent} color={colors.danger} />
        <Count label="Leave" value={a.leave} color={colors.warning} />
      </View>
      <View style={s.strip}>
        {a.days.map((d, i) => (
          <View key={i} style={[s.cell, { backgroundColor: dayColor[d].bg }]}>
            <Text style={[s.cellDay, { color: dayColor[d].fg }]}>{i + 1}</Text>
          </View>
        ))}
      </View>
      <Text style={s.legend}>P present {'•'} A absent {'•'} L leave {'•'} grey: holiday</Text>
    </SectionCard>
  );
}

function Count({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.count}>
      <Text style={[s.countValue, { color }]}>{value}</Text>
      <Text style={s.rowMeta}>{label}</Text>
    </View>
  );
}

export function PayrollTab({ t }: { t: TeacherDetail }) {
  const latest = t.payslips[0];
  const rest = t.payslips.slice(0, 3);
  return (
    <>
      <SectionCard icon="receipt-outline" title="Latest Payslip" right={<Badge label={latest.status} tone={latest.status === 'Paid' ? 'success' : 'warning'} />}>
        <Text style={s.rowMeta}>{latest.monthLabel}</Text>
        <Text style={s.net}>{formatINR(latest.net)}</Text>
        <View style={s.split}>
          <Text style={s.rowMeta}>Gross {formatINR(latest.gross)}</Text>
          <Text style={s.rowMeta}>Deductions {formatINR(latest.deductions)}</Text>
        </View>
        <Text style={s.rowMeta}>Paid on {latest.paidOn}</Text>
      </SectionCard>
      <SectionCard icon="time-outline" title="Last 3 Months">
        <View style={s.list}>
          {rest.map((p) => (
            <View key={p.id} style={s.row}>
              <View style={s.grow}>
                <Text style={s.rowTitle}>{p.monthLabel}</Text>
                <Text style={s.rowMeta}>{p.paidOn}</Text>
              </View>
              <Text style={s.amount}>{formatINR(p.net)}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </>
  );
}

export function DocumentsTab({ t }: { t: TeacherDetail }) {
  return (
    <SectionCard icon="shield-checkmark-outline" title="Documents">
      <DocumentRows docs={t.documents} />
    </SectionCard>
  );
}

export function ReportsTab({ t }: { t: TeacherDetail }) {
  return (
    <SectionCard
      icon="bar-chart-outline"
      title="Reports"
      right={
        <View style={s.range}>
          <Ionicons name="calendar-outline" size={12} color={colors.primaryDeep} />
          <Text style={s.rangeText}>{t.reportRange}</Text>
        </View>
      }
    >
      <View style={s.list}>
        {t.reports.map((r) => (
          <View key={r.id} style={s.row}>
            <View style={s.periodBox}>
              <Ionicons name={r.icon} size={18} color={colors.primaryDeep} />
            </View>
            <View style={s.grow}>
              <Text style={s.rowTitle}>{r.title}</Text>
              <Text style={s.rowMeta}>{r.summary}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textHint} />
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const s = StyleSheet.create({
  list: { gap: 8 },
  grow: { flex: 1, gap: 2 },
  mono: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
  },
  rowTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  rowMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  classBox: { minWidth: 44, height: 36, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  classBoxText: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  periodBox: { width: 40, height: 36, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  periodLabel: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  dayRow: { gap: 8 },
  dayChip: { paddingHorizontal: 16, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  dayChipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  dayText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  dayTextOn: { color: colors.white },
  countRow: { flexDirection: 'row', gap: 8 },
  count: { flex: 1, alignItems: 'center', padding: 10, borderRadius: radius.md, backgroundColor: colors.mintSoft },
  countValue: { fontFamily: fonts.headingExtra, fontSize: 22 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: 36, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellDay: { fontFamily: fonts.monoMedium, fontSize: 11 },
  legend: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  net: { fontFamily: fonts.headingExtra, fontSize: 28, color: colors.text },
  split: { flexDirection: 'row', justifyContent: 'space-between' },
  amount: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.text },
  range: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  rangeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
});
