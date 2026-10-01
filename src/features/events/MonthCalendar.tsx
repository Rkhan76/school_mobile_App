import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import { dayKey, eventOnDay, MONTH_NAMES, type SchoolEvent } from './mockEvents';

type Props = {
  year: number;
  month: number; // 0-11
  events: SchoolEvent[];
  selected: string | null; // YYYY-MM-DD
  onSelect: (key: string, date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
  onToday: () => void;
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type Cell = { key: string; date: Date; inMonth: boolean };

export function MonthCalendar({ year, month, events, selected, onSelect, onMonthChange, onToday }: Props) {
  const todayKey = dayKey(new Date());

  const cells = useMemo<Cell[]>(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
    const out: Cell[] = [];
    for (let i = 0; i < total; i++) {
      const date = new Date(year, month, 1 - first.getDay() + i);
      out.push({ key: dayKey(date), date, inMonth: date.getMonth() === month });
    }
    return out;
  }, [year, month]);

  const info = useMemo(() => {
    const map = new Map<string, { has: boolean; holiday: boolean }>();
    for (const c of cells) {
      const onDay = events.filter((e) => eventOnDay(e, c.key));
      if (onDay.length) map.set(c.key, { has: true, holiday: onDay.some((e) => e.isHoliday) });
    }
    return map;
  }, [cells, events]);

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Pressable style={styles.nav} onPress={() => shift(-1)} accessibilityLabel="Previous month" hitSlop={6}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>
        <Pressable style={styles.nav} onPress={() => shift(1)} accessibilityLabel="Next month" hitSlop={6}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.month}>{MONTH_NAMES[month]} {year}</Text>
        <Pressable onPress={onToday} hitSlop={8} accessibilityLabel="Go to today">
          <Text style={styles.today}>Today</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => <Text key={w} style={styles.weekday}>{w}</Text>)}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.weekRow}>
          {row.map((c) => {
            const i = info.get(c.key);
            const isToday = c.key === todayKey;
            const isSel = c.key === selected;
            const holiday = !!i?.holiday;
            return (
              <Pressable key={c.key} style={styles.cellWrap} onPress={() => onSelect(c.key, c.date)}>
                <View
                  style={[
                    styles.cell,
                    i?.has && !holiday && styles.cellEvent,
                    holiday && styles.cellHoliday,
                    isToday && styles.cellToday,
                    isSel && styles.cellSel,
                  ]}
                >
                  <Text
                    style={[
                      styles.num,
                      !c.inMonth && styles.numOut,
                      holiday && styles.numHoliday,
                      isSel && styles.numSel,
                    ]}
                  >
                    {c.date.getDate()}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      !i?.has && styles.dotHidden,
                      { backgroundColor: isSel ? colors.white : holiday ? colors.danger : colors.blue },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  nav: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mintSoft,
  },
  month: { flex: 1, marginLeft: 6, fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  today: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primary },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 10, color: colors.textHint,
    paddingVertical: 6,
  },
  cellWrap: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  cell: {
    width: 38, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent', gap: 2,
  },
  cellEvent: { backgroundColor: colors.mint },
  cellHoliday: { backgroundColor: colors.dangerBg },
  cellToday: { borderColor: colors.primary },
  cellSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  num: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  numOut: { color: colors.textHint },
  numHoliday: { color: colors.danger },
  numSel: { color: colors.white, fontFamily: fonts.bodySemi },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotHidden: { opacity: 0 },
});
