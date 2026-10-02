import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import { DAY_TO_DOW, DAYS, subjectColor, type Day, type Period, type TimetableSlot } from './types';

type Props = { periods: Period[]; slots: TimetableSlot[]; today?: Day | null };

/** Compact mini-grid of the whole week (horizontally scrollable). */
export function WeekOverview({ periods, slots, today }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.periodCell} />
          {DAYS.map((d) => (
            <View key={d} style={styles.cell}>
              <Text style={[styles.head, d === today && styles.headToday]}>{d}</Text>
            </View>
          ))}
        </View>
        {periods.map((p) => (
          <View key={p.id} style={styles.row}>
            <View style={styles.periodCell}>
              <Text style={styles.periodText} numberOfLines={1}>{p.isBreak ? p.name : p.name.replace('Period ', 'P')}</Text>
            </View>
            {p.isBreak ? (
              <View style={styles.breakCell}><Text style={styles.breakText}>Break</Text></View>
            ) : (
              DAYS.map((d) => {
                const dow = DAY_TO_DOW[d];
                const s = slots.find((x) => x.dayOfWeek === dow && x.period.id === p.id);
                const subjectName = s?.subject?.name;
                return (
                  <View key={d} style={styles.cell}>
                    {subjectName ? (
                      <View style={[styles.tag, { backgroundColor: `${subjectColor(s?.subject?.id ?? subjectName)}22` }]}>
                        <Text style={[styles.tagText, { color: subjectColor(s?.subject?.id ?? subjectName) }]} numberOfLines={1}>
                          {subjectName}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.empty}>-</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const CELL_W = 62;
const styles = StyleSheet.create({
  scroll: {
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  grid: { padding: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  periodCell: { width: 52 },
  periodText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  cell: { width: CELL_W, alignItems: 'center' },
  head: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  headToday: { color: colors.primary },
  tag: { width: CELL_W - 4, paddingVertical: 5, borderRadius: 8, alignItems: 'center' },
  tagText: { fontFamily: fonts.bodySemi, fontSize: 10.5 },
  empty: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  breakCell: {
    width: (CELL_W + 4) * 6 - 4, paddingVertical: 4, borderRadius: 8, alignItems: 'center', backgroundColor: '#ffedd5',
  },
  breakText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: '#c2410c' },
});
