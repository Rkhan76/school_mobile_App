import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../../theme/tokens';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  shown: number;
  onChange: (page: number) => void;
}

type Item = number | 'gap-l' | 'gap-r';

/** Page numbers with ellipses, e.g. 1 2 ... 8. */
function pageItems(page: number, last: number): Item[] {
  if (last <= 5) return Array.from({ length: last }, (_, i) => i + 1);
  const set = new Set<number>([1, last, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out: Item[] = [];
  nums.forEach((n, i) => {
    const prev = nums[i - 1];
    if (prev !== undefined && n - prev > 1) out.push(prev < page ? 'gap-l' : 'gap-r');
    out.push(n);
  });
  return out;
}

export function Pagination({ page, pageSize, total, shown, onChange }: Props) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.summary}>
        Showing <Text style={styles.bold}>{shown}</Text> of <Text style={styles.bold}>{total}</Text> students
      </Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.nav, page <= 1 && styles.disabled]}
          disabled={page <= 1}
          onPress={() => onChange(page - 1)}
          accessibilityLabel="Previous page"
        >
          <Ionicons name="chevron-back" size={16} color={colors.primaryDeep} />
          <Text style={styles.navText}>Prev</Text>
        </Pressable>
        <View style={styles.chips}>
          {pageItems(page, last).map((it) =>
            typeof it === 'number' ? (
              <Pressable
                key={it}
                onPress={() => onChange(it)}
                style={[styles.chip, it === page && styles.chipActive]}
                accessibilityLabel={`Page ${it}`}
              >
                <Text style={[styles.chipText, it === page && styles.chipTextActive]}>{it}</Text>
              </Pressable>
            ) : (
              <Text key={it} style={styles.gap}>...</Text>
            ),
          )}
        </View>
        <Pressable
          style={[styles.nav, page >= last && styles.disabled]}
          disabled={page >= last}
          onPress={() => onChange(page + 1)}
          accessibilityLabel="Next page"
        >
          <Text style={styles.navText}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primaryDeep} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12, paddingTop: 6 },
  summary: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  bold: { fontFamily: fonts.bodySemi, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nav: {
    flexDirection: 'row', alignItems: 'center', gap: 2, height: 36, paddingHorizontal: 10,
    borderRadius: radius.md, backgroundColor: colors.mint,
  },
  navText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  disabled: { opacity: 0.4 },
  chip: { minWidth: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  gap: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint, paddingHorizontal: 2 },
});
