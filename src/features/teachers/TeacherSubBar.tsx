import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, radius } from '../../theme/tokens';

export function TeacherSubBar({
  active,
  busy,
  canToggleStatus,
  onToggleStatus,
  canEdit,
  onEdit,
  canBlock,
  onMore,
}: {
  active: boolean;
  busy?: boolean;
  canToggleStatus: boolean;
  onToggleStatus: () => void;
  canEdit: boolean;
  onEdit: () => void;
  canBlock: boolean;
  onMore: () => void;
}) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.back}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={20} color={colors.primaryDeep} />
        <Text style={styles.backText}>Directory</Text>
      </Pressable>
      <View style={styles.right}>
        {canEdit ? (
          <Pressable style={styles.iconBtn} onPress={onEdit} accessibilityLabel="Edit teacher">
            <Ionicons name="pencil" size={16} color={colors.primaryDeep} />
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.pill, !active && styles.pillOff, !canToggleStatus && styles.pillStatic]}
          onPress={canToggleStatus ? onToggleStatus : undefined}
          disabled={!canToggleStatus || busy}
          accessibilityLabel={canToggleStatus ? 'Toggle active status' : 'Status'}
        >
          {busy ? (
            <ActivityIndicator size="small" color={active ? colors.primaryDeep : colors.danger} />
          ) : (
            <View style={[styles.dot, !active && styles.dotOff]} />
          )}
          <Text style={[styles.pillText, !active && styles.pillTextOff]}>{active ? 'ACTIVE' : 'INACTIVE'}</Text>
        </Pressable>
        {canBlock ? (
          <Pressable style={styles.iconBtn} onPress={onMore} accessibilityLabel="More actions">
            <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  backText: { fontFamily: fonts.heading, fontSize: 16, color: colors.primaryDeep },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 12,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  pillOff: { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
  pillStatic: { opacity: 0.9 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primaryDeep },
  dotOff: { backgroundColor: colors.danger },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.5, color: colors.primaryDeep },
  pillTextOff: { color: colors.danger },
});
