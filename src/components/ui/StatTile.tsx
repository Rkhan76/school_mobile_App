import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '../../theme/tokens';

type Props = {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint?: string;
};

/** Compact stat card (icon tile, big number, label) used at the top of list screens. */
export function StatTile({ label, value, icon, tint = colors.primary }: Props) {
  return (
    <View style={styles.tile}>
      <View style={[styles.icon, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.cardSolid,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
    ...shadow.card,
  },
  icon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.headingExtra, fontSize: 20, color: colors.text },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
});
