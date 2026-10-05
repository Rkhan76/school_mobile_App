import { StyleSheet, View } from 'react-native';
import { StatTile } from '../../../components/ui/StatTile';
import { colors, themed } from '../../../theme/tokens';
import type { StudentStats } from '../types';

export function StatsGrid({ stats }: { stats: StudentStats }) {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatTile label="Total Students" value={String(stats.total)} icon="people-outline" tint={colors.indigo} />
        <StatTile label="Male" value={String(stats.male)} icon="male-outline" tint={colors.primary} />
      </View>
      <View style={styles.row}>
        <StatTile label="Female" value={String(stats.female)} icon="female-outline" tint={colors.primaryDeep} />
        <StatTile label="With Portal Access" value={String(stats.withPortalAccess)} icon="school-outline" tint={colors.purple} />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
}));
