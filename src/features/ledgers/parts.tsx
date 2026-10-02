import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { formatMoney, isoToInput, type CashbookEntry, type LedgerEntry } from './mockLedgers';

export type Filters = { type: string; category: string; from: string; to: string; pageSize: number };
export const EMPTY_FILTERS: Filters = { type: '', category: '', from: '', to: '', pageSize: 20 };

export function activeFilterCount(f: Filters): number {
  return [f.type, f.category, f.from.trim(), f.to.trim()].filter((v) => v !== '').length + (f.pageSize !== 20 ? 1 : 0);
}

/* ---------- segmented control ---------- */

export type Mode = 'ledger' | 'cashbook';

export function SegmentedControl({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const items: { value: Mode; label: string }[] = [
    { value: 'ledger', label: 'School Ledger' },
    { value: 'cashbook', label: 'Cashbook' },
  ];
  return (
    <View style={styles.seg}>
      {items.map((i) => {
        const on = i.value === mode;
        return (
          <Pressable key={i.value} style={[styles.segBtn, on && styles.segOn]} onPress={() => onChange(i.value)}>
            <Text style={[styles.segText, on && styles.segTextOn]}>{i.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- pagination ---------- */

export function Pagination({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <View style={styles.pgWrap}>
      <Text style={styles.pgInfo}>Showing {from} to {to} of {total} entries</Text>
      {pages > 1 && (
        <View style={styles.pgRow}>
          <Pressable style={[styles.pgBtn, page <= 1 && styles.off]} disabled={page <= 1} onPress={() => onChange(page - 1)}>
            <Text style={styles.pgBtnText}>Previous</Text>
          </Pressable>
          <Text style={styles.pgPage}>Page {page} of {pages}</Text>
          <Pressable style={[styles.pgBtn, page >= pages && styles.off]} disabled={page >= pages} onPress={() => onChange(page + 1)}>
            <Text style={styles.pgBtnText}>Next</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/* ---------- active filter chips ---------- */

type ChipKey = 'type' | 'category' | 'from' | 'to' | 'pageSize';

export function ActiveFilterChips({ filters, typeLabel, onClear }: { filters: Filters; typeLabel: (v: string) => string; onClear: (k: ChipKey) => void }) {
  const chips: { key: ChipKey; text: string }[] = [];
  if (filters.type) chips.push({ key: 'type', text: `Type: ${typeLabel(filters.type)}` });
  if (filters.category) chips.push({ key: 'category', text: `Category: ${filters.category}` });
  if (filters.from.trim()) chips.push({ key: 'from', text: `From: ${filters.from}` });
  if (filters.to.trim()) chips.push({ key: 'to', text: `To: ${filters.to}` });
  if (filters.pageSize !== 20) chips.push({ key: 'pageSize', text: `${filters.pageSize} rows` });
  if (chips.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {chips.map((c) => (
        <Pressable key={c.key} style={styles.chip} onPress={() => onClear(c.key)} accessibilityLabel={`Clear ${c.text}`}>
          <Text style={styles.chipText}>{c.text}</Text>
          <Ionicons name="close" size={14} color={colors.primaryDeep} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

/* ---------- entry cards ---------- */

function TypeIcon({ credit }: { credit: boolean }) {
  return (
    <View style={[styles.typeIcon, { backgroundColor: credit ? colors.successBg : colors.dangerBg }]}>
      <Ionicons name={credit ? 'arrow-up' : 'arrow-down'} size={18} color={credit ? colors.success : colors.danger} />
    </View>
  );
}

function Amount({ credit, amount }: { credit: boolean; amount: number }) {
  return (
    <Text style={[styles.amount, { color: credit ? colors.success : colors.danger }]}>
      {credit ? '+' : '-'}{formatMoney(amount)}
    </Text>
  );
}

export function LedgerCard({ item }: { item: LedgerEntry }) {
  const credit = item.type === 'CREDIT';
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <TypeIcon credit={credit} />
        <View style={styles.topText}>
          <Text style={styles.date}>{isoToInput(item.date)}</Text>
          <Badge label={item.category} tone="primary" />
        </View>
        <Amount credit={credit} amount={item.amount} />
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="document-text-outline" size={14} color={colors.textHint} />
        <Text style={styles.meta} numberOfLines={1}>{item.source}</Text>
      </View>
    </Card>
  );
}

type CashProps = { item: CashbookEntry; onEdit: (e: CashbookEntry) => void; onDelete: (e: CashbookEntry) => void };

export function CashbookCard({ item, onEdit, onDelete }: CashProps) {
  const credit = item.type === 'IN';
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <TypeIcon credit={credit} />
        <View style={styles.topText}>
          <Text style={styles.date}>{isoToInput(item.date)}</Text>
          <Badge label={item.category} tone="primary" />
        </View>
        <Amount credit={credit} amount={item.amount} />
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={14} color={colors.textHint} />
        <Text style={[styles.meta, styles.flex]} numberOfLines={1}>{item.counterparty || '-'}</Text>
        <Badge label={item.method} tone="neutral" />
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.actBtn} onPress={() => onEdit(item)} accessibilityLabel="Edit entry">
          <Ionicons name="create-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.actText}>Edit</Text>
        </Pressable>
        <Pressable style={[styles.actBtn, styles.actDanger]} onPress={() => onDelete(item)} accessibilityLabel="Delete entry">
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={[styles.actText, { color: colors.danger }]}>Delete</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.mint },
  segBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  segOn: { backgroundColor: colors.primary },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  segTextOn: { color: colors.white },

  pgWrap: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  pgInfo: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  pgRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pgBtn: { height: 38, paddingHorizontal: 16, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mint },
  off: { opacity: 0.4 },
  pgBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  pgPage: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },

  chipRow: { gap: 8, paddingVertical: 2 },
  chip: { height: 32, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, backgroundColor: colors.mint },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },

  card: { gap: 10, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topText: { flex: 1, gap: 4 },
  typeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  date: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  amount: { fontFamily: fonts.heading, fontSize: 15 },
  desc: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  actBtn: { flex: 1, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, backgroundColor: colors.mint },
  actDanger: { backgroundColor: colors.dangerBg },
  actText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
});
