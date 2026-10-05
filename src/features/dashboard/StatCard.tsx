import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { Sparkline } from './Sparkline';
import type { StatItem } from './mockData';

export function StatCard({ item }: { item: StatItem }) {
  const tone = item.trendUp ? colors.success : colors.danger;
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <View style={[styles.trend, { backgroundColor: item.trendUp ? colors.successBg : colors.dangerBg }]}>
          <Text style={[styles.trendText, { color: tone }]}>{item.trendUp ? '↗' : '↘'} {item.trend}</Text>
        </View>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.caption}>{item.caption}</Text>
      <View style={styles.spark}>
        <Sparkline data={item.spark} />
      </View>
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { flex: 1, padding: 14, gap: 2 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  icon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  trend: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3 },
  trendText: { fontFamily: fonts.bodySemi, fontSize: 10 },
  value: { fontFamily: fonts.headingExtra, fontSize: 24, color: colors.text },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  caption: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
  spark: { marginTop: 8, height: 28 },
}));
