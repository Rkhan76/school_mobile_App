import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../../theme/tokens';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: Props) {
  if (total === 0) return null;
  const last = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: last }, (_, i) => i + 1);
  return (
    <View style={styles.wrap}>
      <Text style={styles.summary}>
        Showing <Text style={styles.bold}>{from}</Text> to <Text style={styles.bold}>{to}</Text> of{' '}
        <Text style={styles.bold}>{total}</Text> entries
      </Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.nav, page <= 1 && styles.disabled]}
          disabled={page <= 1}
          onPress={() => onChange(page - 1)}
          accessibilityLabel="Previous page"
        >
          <Ionicons name="chevron-back" size={16} color={colors.primaryDeep} />
        </Pressable>
        {pages.map((p) => (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={[styles.chip, p === page && styles.chipActive]}
            accessibilityLabel={`Page ${p}`}
          >
            <Text style={[styles.chipText, p === page && styles.chipTextActive]}>{p}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.nav, page >= last && styles.disabled]}
          disabled={page >= last}
          onPress={() => onChange(page + 1)}
          accessibilityLabel="Next page"
        >
          <Ionicons name="chevron-forward" size={16} color={colors.primaryDeep} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12, paddingTop: 6 },
  summary: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  bold: { fontFamily: fonts.bodySemi, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  nav: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  chip: { minWidth: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
}));
