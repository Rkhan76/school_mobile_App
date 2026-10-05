import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../theme/tokens';

type Props = { page: number; pageSize: number; total: number; shown: number; onChange: (p: number) => void };

export function Pagination({ page, pageSize, total, shown, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const seen = Math.min(total, (page - 1) * pageSize + shown);
  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>Showing {seen} of {total}</Text>
      {pages > 1 && (
        <View style={styles.btns}>
          <Pressable disabled={page <= 1} onPress={() => onChange(page - 1)} style={[styles.btn, page <= 1 && styles.off]} accessibilityLabel="Previous page">
            <Ionicons name="chevron-back" size={18} color={colors.primaryDeep} />
          </Pressable>
          <Text style={styles.page}>{page} / {pages}</Text>
          <Pressable disabled={page >= pages} onPress={() => onChange(page + 1)} style={[styles.btn, page >= pages && styles.off]} accessibilityLabel="Next page">
            <Ionicons name="chevron-forward" size={18} color={colors.primaryDeep} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  info: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.4 },
  page: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
}));
