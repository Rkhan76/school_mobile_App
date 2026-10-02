import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={14} color={colors.textHint} />
      <Text style={styles.rowText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

export function IdPill({ id }: { id: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{id}</Text>
    </View>
  );
}

export function IconBtn({ icon, onPress, label, danger }: { icon: IconName; onPress: () => void; label: string; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={[styles.btn, danger && styles.btnDanger]} hitSlop={4}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primaryDeep} />
    </Pressable>
  );
}

export function Name({ children }: { children: string }) {
  return <Text style={cardStyles.name} numberOfLines={1}>{children}</Text>;
}

export const cardStyles = StyleSheet.create({
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  info: { gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  spacer: { flex: 1 },
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  pill: { alignSelf: 'flex-start', backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.primaryDeep },
  btn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  btnDanger: { backgroundColor: colors.dangerBg },
});
