import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import type { Milestone } from './mockData';

export function Milestones({ items }: { items: Milestone[] }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Upcoming Milestones</Text>
      {items.map((m) => (
        <View key={m.id} style={styles.row}>
          <View style={styles.date}>
            <Text style={styles.month}>{m.month}</Text>
            <Text style={styles.day}>{m.day}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{m.title}</Text>
            <Text style={styles.sub} numberOfLines={1}>{m.subtitle}</Text>
          </View>
          <Badge label={m.badge} tone={m.badgeTone} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: { width: 48, height: 52, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  month: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.primary, letterSpacing: 0.8 },
  day: { fontFamily: fonts.headingExtra, fontSize: 18, color: colors.primaryDeep, lineHeight: 22 },
  info: { flex: 1 },
  name: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
});
