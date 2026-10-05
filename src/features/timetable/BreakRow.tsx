import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { formatTime, type Period } from './types';

/** Full-width orange "Break" row (Recess / Lunch). */
export function BreakRow({ period, isNow }: { period: Period; isNow?: boolean }) {
  return (
    <View style={[styles.row, isNow && styles.rowNow]}>
      <View style={styles.left}>
        <Text style={styles.name}>{period.name}</Text>
        <Text style={styles.time}>{formatTime(period.startTime)} – {formatTime(period.endTime)}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>Break</Text>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14,
    borderRadius: radius.lg, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa',
  },
  rowNow: { borderColor: colors.orange, borderWidth: 2 },
  left: { gap: 2 },
  name: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  time: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: '#ffedd5' },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 12, color: '#c2410c' },
}));
