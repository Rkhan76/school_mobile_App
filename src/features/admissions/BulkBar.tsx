import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, themed } from '../../theme/tokens';

type Props = {
  count: number;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  canApprove?: boolean;
  canReject?: boolean;
};

/** Sticky multi-select action bar pinned to the bottom of the screen. */
export function BulkBar({ count, onApprove, onReject, onCancel, canApprove = true, canReject = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      <Pressable onPress={onCancel} hitSlop={8} accessibilityLabel="Clear selection">
        <Ionicons name="close" size={22} color={colors.textSecondary} />
      </Pressable>
      <Text style={styles.count}>{count} selected</Text>
      {canApprove && (
        <Pressable style={[styles.btn, { backgroundColor: colors.success }]} onPress={onApprove}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
          <Text style={styles.btnText}>Approve</Text>
        </Pressable>
      )}
      {canReject && (
        <Pressable style={[styles.btn, { backgroundColor: colors.danger }]} onPress={onReject}>
          <Ionicons name="close-circle-outline" size={16} color={colors.white} />
          <Text style={styles.btnText}>Reject</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.cardSolid, borderTopWidth: 1,
    borderTopColor: colors.border, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.card,
  },
  count: { flex: 1, fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40, paddingHorizontal: 14, borderRadius: radius.pill },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
}));
