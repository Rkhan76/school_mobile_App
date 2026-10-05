import { StyleSheet, View } from 'react-native';
import { StatTile } from '../../../components/ui/StatTile';
import { colors, themed } from '../../../theme/tokens';
import type { ClassStats } from '../mockClasses';

export function StatsGrid({ stats }: { stats: ClassStats }) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatTile label="Total Classes" value={String(stats.totalClasses)} icon="book-outline" tint={colors.indigo} />
        <StatTile label="Total Sections" value={String(stats.totalSections)} icon="grid-outline" tint={colors.primary} />
      </View>
      <View style={styles.row}>
        <StatTile label="Active" value={String(stats.active)} icon="checkmark-circle-outline" tint={colors.primaryDeep} />
        <StatTile label="New This Year" value={String(stats.newThisYear)} icon="trending-up-outline" tint={colors.purple} />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
}));
