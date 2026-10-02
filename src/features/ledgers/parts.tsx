import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { formatMoney, isoToInput, parseAmount, titleCase, type CashbookEntry, type LedgerEntry } from './types';

export type Filters = { entryType: string; category: string; from: string; to: string; pageSize: number };
export const EMPTY_FILTERS: Filters = { entryType: '', category: '', from: '', to: '', pageSize: 20 };

export function activeFilterCount(f: Filters): number {
  return (
    [f.entryType, f.category, f.from.trim(), f.to.trim()].filter((v) => v !== '').length +
    (f.pageSize !== 20 ? 1 : 0)
  );
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

/* ---------- active filter chips ---------- */

type ChipKey = 'entryType' | 'category' | 'from' | 'to' | 'pageSize';

export function ActiveFilterChips({ filters, typeLabel, categoryLabel, onClear }: {
  filters: Filters;
  typeLabel: (v: string) => string;
  categoryLabel: (v: string) => string;
  onClear: (k: ChipKey) => void;
}) {
  const chips: { key: ChipKey; text: string }[] = [];
  if (filters.entryType) chips.push({ key: 'entryType', text: `Type: ${typeLabel(filters.entryType)}` });
  if (filters.category) chips.push({ key: 'category', text: `Category: ${categoryLabel(filters.category)}` });
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

/* ---------- notices (plan-locked / error / empty) ---------- */

export function Notice({ icon, tint, title, message, action, onAction }: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Card style={styles.notice}>
      <View style={[styles.noticeIconWrap, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={30} color={tint} />
      </View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeMsg}>{message}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.noticeBtn} accessibilityRole="button">
          <Ionicons name="refresh" size={16} color={colors.white} />
          <Text style={styles.noticeBtnText}>{action}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function PlanLockedNotice({ feature }: { feature: string }) {
  return (
    <Notice
      icon="lock-closed-outline"
      tint={colors.warning}
      title={`${feature} isn't on your plan`}
      message={`Ask your school admin to upgrade the plan to unlock the ${feature.toLowerCase()}.`}
    />
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Notice
      icon="alert-circle-outline"
      tint={colors.danger}
      title="Could not load entries"
      message={message}
      action="Retry"
      onAction={onRetry}
    />
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

function Amount({ credit, amount }: { credit: boolean; amount: string }) {
  return (
    <Text style={[styles.amount, { color: credit ? colors.success : colors.danger }]}>
      {credit ? '+' : '-'}{formatMoney(parseAmount(amount))}
    </Text>
  );
}

export function LedgerCard({ item }: { item: LedgerEntry }) {
  const credit = item.entryType === 'CREDIT';
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <TypeIcon credit={credit} />
        <View style={styles.topText}>
          <Text style={styles.date}>{isoToInput(item.entryDate)}</Text>
          <Badge label={titleCase(item.category)} tone="primary" />
        </View>
        <Amount credit={credit} amount={item.amount} />
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="document-text-outline" size={14} color={colors.textHint} />
        <Text style={styles.meta} numberOfLines={1}>{titleCase(item.sourceType)}</Text>
      </View>
    </Card>
  );
}

type CashProps = { item: CashbookEntry; onDelete?: (e: CashbookEntry) => void };

export function CashbookCard({ item, onDelete }: CashProps) {
  const credit = item.entryType === 'CREDIT';
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <TypeIcon credit={credit} />
        <View style={styles.topText}>
          <Text style={styles.date}>{isoToInput(item.entryDate)}</Text>
          <Badge label={titleCase(item.category)} tone="primary" />
        </View>
        <Amount credit={credit} amount={item.amount} />
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={14} color={colors.textHint} />
        <Text style={[styles.meta, styles.flex]} numberOfLines={1}>{item.counterpartyName || '-'}</Text>
        <Badge label={titleCase(item.paymentMethod)} tone="neutral" />
      </View>
      {onDelete ? (
        <View style={styles.actions}>
          <Pressable style={[styles.actBtn, styles.actDanger]} onPress={() => onDelete(item)} accessibilityLabel="Delete entry">
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[styles.actText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.mint },
  segBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  segOn: { backgroundColor: colors.primary },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  segTextOn: { color: colors.white },

  chipRow: { gap: 8, paddingVertical: 2 },
  chip: { height: 32, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, backgroundColor: colors.mint },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },

  notice: { alignItems: 'center', gap: 8, paddingVertical: 32, marginHorizontal: 16 },
  noticeIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  noticeTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  noticeMsg: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 8, lineHeight: 19 },
  noticeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, height: 42, paddingHorizontal: 20, borderRadius: radius.pill, backgroundColor: colors.primaryDeep },
  noticeBtnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },

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
