import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, themed } from '../../theme/tokens';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Card with icon tile + title header (mirrors the student detail cards). */
export function SectionCard({
  icon,
  title,
  right,
  children,
}: {
  icon: IconName;
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={16} color={colors.primaryDeep} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {right}
      </View>
      {children}
    </Card>
  );
}

/** Small uppercase label above a value (two-column grid cell). */
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = themed(() => StyleSheet.create({
  card: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconTile: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: colors.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  field: { width: '50%', paddingRight: 8, gap: 2 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.6, color: colors.textHint, textTransform: 'uppercase' },
  fieldValue: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
}));
