import { StyleSheet, View } from 'react-native';
import { StatTile } from '../../../components/ui/StatTile';
import { colors, themed } from '../../../theme/tokens';
import type { ClassStats } from '../types';

export function StatsGrid({ stats }: { stats: ClassStats }) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatTile label="Total Classes" value={String(stats.totalClasses)} icon="book-outline" tint={colors.indigo} />
        <StatTile label="Total Sections" value={String(stats.totalSections)} icon="grid-outline" tint={colors.primary} />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
}));
