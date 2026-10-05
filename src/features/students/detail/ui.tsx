import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';
import { colors, fonts, themed } from '../../../theme/tokens';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Card with an icon tile, title and optional right-side element. */
export function SectionCard({ icon, title, right, children }: { icon: IconName; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={16} color={colors.primaryDeep} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {right}
      </View>
      {children}
    </Card>
  );
}

export function LabelValue({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.lv}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, mono && { fontFamily: fonts.monoMedium }]}>{value}</Text>
    </View>
  );
}

export function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

const styles = themed(() => StyleSheet.create({
  card: { padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  lv: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.6, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
}));
