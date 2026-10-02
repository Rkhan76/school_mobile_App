import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';

type Props = { page: number; pageSize: number; total: number; shown: number; onChange: (p: number) => void };

export function Pagination({ page, pageSize, total, shown, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>Showing {shown} of {total} entries</Text>
      <View style={styles.row}>
        <Pressable style={[styles.btn, page <= 1 && styles.off]} disabled={page <= 1} onPress={() => onChange(page - 1)}>
          <Text style={styles.btnText}>Previous</Text>
        </Pressable>
        <Text style={styles.page}>Page {page} of {pages}</Text>
        <Pressable style={[styles.btn, page >= pages && styles.off]} disabled={page >= pages} onPress={() => onChange(page + 1)}>
          <Text style={styles.btnText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  info: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { height: 38, paddingHorizontal: 16, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mint },
  off: { opacity: 0.4 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  page: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
});
