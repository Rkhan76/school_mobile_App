import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';

type Props = { page: number; pageSize: number; total: number; onChange: (p: number) => void };

function pageList(page: number, pages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>Showing {from} to {to} of {total} entries</Text>
      {pages > 1 && (
        <View style={styles.row}>
          <Pressable style={[styles.btn, page <= 1 && styles.off]} disabled={page <= 1} onPress={() => onChange(page - 1)}>
            <Text style={styles.btnText}>Prev</Text>
          </Pressable>
          {pageList(page, pages).map((p) => (
            <Pressable key={p} style={[styles.chip, p === page && styles.chipOn]} onPress={() => onChange(p)}>
              <Text style={[styles.chipText, p === page && styles.chipTextOn]}>{p}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.btn, page >= pages && styles.off]} disabled={page >= pages} onPress={() => onChange(page + 1)}>
            <Text style={styles.btnText}>Next</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  info: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { height: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mint },
  off: { opacity: 0.4 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  chip: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
});
