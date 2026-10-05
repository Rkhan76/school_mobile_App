import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { addDays, daysInMonth, isFuture, monthLabel, monthStart, weekdayIndex } from './dateUtils';
import { classDayPercent, type AttendanceStatus } from './mockAttendance';
import { STATUS_META } from './parts';

/* ------------------------------ summary card ------------------------------ */

type SummaryProps = {
  counts: Record<AttendanceStatus | 'NONE', number>;
  total: number;
};

const BAR_ORDER: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE'];

/** Present % (present + late) with a stacked View bar. */
export function SummaryCard({ counts, total }: SummaryProps) {
  const marked = total - counts.NONE;
  const pct = marked ? Math.round(((counts.PRESENT + counts.LATE) / marked) * 100) : 0;
  return (
    <Card style={styles.summary}>
      <View style={styles.summaryTop}>
        <View>
          <Text style={styles.pct}>{marked ? `${pct}%` : '--'}</Text>
          <Text style={styles.pctLabel}>present today</Text>
        </View>
        <Text style={styles.summaryMeta}>{marked} of {total} marked</Text>
      </View>
      <View style={styles.bar} accessibilityLabel={`${pct} percent present`}>
        {BAR_ORDER.map((s) =>
          counts[s] > 0 ? <View key={s} style={{ flex: counts[s], backgroundColor: STATUS_META[s].fg }} /> : null,
        )}
        {counts.NONE > 0 ? <View style={{ flex: counts.NONE, backgroundColor: colors.border }} /> : null}
      </View>
    </Card>
  );
}

/* ------------------------------ monthly heat strip ------------------------------ */

function heatColor(p: number): string {
  if (p >= 90) return colors.success;
  if (p >= 80) return '#86d29c';
  if (p >= 75) return '#f6c667';
  return colors.danger;
}

type HeatProps = { classId: string; sectionId: string; date: string };

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MonthlyHeat({ classId, sectionId, date }: HeatProps) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const start = monthStart(date);
  const cells = useMemo(() => {
    const n = daysInMonth(date);
    const lead = weekdayIndex(start);
    const out: ({ iso: string; day: number; pct: number | null } | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= n; d += 1) {
      const iso = addDays(start, d - 1);
      out.push({ iso, day: d, pct: isFuture(iso) ? null : classDayPercent(classId, sectionId, iso) });
    }
    return out;
  }, [classId, sectionId, date, start]);
  const shown = picked ? cells.find((c) => c?.iso === picked) : null;
  const avg = useMemo(() => {
    const vals = cells.flatMap((c) => (c && c.pct !== null ? [c.pct] : []));
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [cells]);

  return (
    <Card style={{ gap: 12 }}>
      <Pressable style={styles.toggle} onPress={() => setOpen((o) => !o)} accessibilityRole="button">
        <Ionicons name="calendar-number-outline" size={18} color={colors.primaryDeep} />
        <Text style={styles.toggleText}>Monthly summary</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textHint} />
      </Pressable>
      {open ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.monthTitle}>{monthLabel(date)} · class average {avg}%</Text>
          <View style={styles.grid}>
            {WEEK.map((w, i) => (
              <Text key={i} style={styles.weekHead}>{w}</Text>
            ))}
            {cells.map((c, i) =>
              c ? (
                <Pressable
                  key={c.iso}
                  onPress={() => setPicked(c.iso)}
                  style={[
                    styles.cell,
                    { backgroundColor: c.pct === null ? colors.mintSoft : heatColor(c.pct) },
                    picked === c.iso && styles.cellPicked,
                  ]}
                  accessibilityLabel={`${c.day}: ${c.pct === null ? 'no data' : `${c.pct} percent`}`}
                >
                  <Text style={[styles.cellText, c.pct === null && { color: colors.textHint }]}>{c.day}</Text>
                </Pressable>
              ) : (
                <View key={`b${i}`} style={styles.cell} />
              ),
            )}
          </View>
          <Text style={styles.caption}>
            {shown ? `${shown.day} ${monthLabel(date)}: ${shown.pct === null ? 'no class' : `${shown.pct}% present`}` : 'Tap a day to see its attendance %'}
          </Text>
          <View style={styles.legend}>
            {[
              ['90%+', colors.success], ['80-89%', '#86d29c'], ['75-79%', '#f6c667'], ['<75%', colors.danger],
            ].map(([l, c]) => (
              <View key={l} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: c }]} />
                <Text style={styles.legendText}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const CELL = `${100 / 7}%` as const;

const styles = themed(() => StyleSheet.create({
  summary: { gap: 12 },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  pct: { fontFamily: fonts.headingExtra, fontSize: 30, color: colors.primaryDeep },
  pctLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  summaryMeta: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  bar: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.border },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  monthTitle: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekHead: { width: CELL, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 10, color: colors.textHint, marginBottom: 4 },
  cell: { width: CELL, aspectRatio: 1, borderWidth: 2, borderColor: colors.cardSolid, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cellPicked: { borderWidth: 2, borderColor: colors.text },
  cellText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white, textAlign: 'center' },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  legend: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: fonts.body, fontSize: 10, color: colors.textSecondary },
}));
