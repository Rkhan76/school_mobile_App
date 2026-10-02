import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { CashbookFormModal } from './CashbookFormModal';
import { ListShell, useListControls } from './ListShell';
import {
  CASH_CATEGORIES, LEDGER_CATEGORIES, formatMoney, useCashbook, useLedger,
  type CashType, type CashbookEntry, type EntryType,
} from './mockLedgers';
import { CashbookCard, LedgerCard, SegmentedControl, type Mode } from './parts';

const LEDGER_TYPES = [
  { value: '', label: 'All' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
];
const CASH_TYPES = [
  { value: '', label: 'All' },
  { value: 'IN', label: 'IN' },
  { value: 'OUT', label: 'OUT' },
];

function LedgerTab() {
  const c = useListControls();
  const type = c.filters.type as EntryType | '';
  const { data, total, stats, isLoading, refetch } = useLedger({ ...c.query, type });
  return (
    <ListShell
      controls={c}
      placeholder="Search description..."
      sheetTitle="Filter ledger"
      typeOptions={LEDGER_TYPES}
      categories={LEDGER_CATEGORIES}
      tiles={
        <>
          <View style={styles.tileRow}>
            <StatTile label="Total Entries" value={String(stats.totalEntries)} icon="list-outline" />
            <StatTile label="Net Balance" value={formatMoney(stats.net)} icon="wallet-outline" tint={colors.indigo} />
          </View>
          <View style={styles.tileRow}>
            <StatTile label="Total Credit" value={formatMoney(stats.credit)} icon="arrow-up" tint={colors.success} />
            <StatTile label="Total Debit" value={formatMoney(stats.debit)} icon="arrow-down" tint={colors.danger} />
          </View>
        </>
      }
      data={data}
      total={total}
      isLoading={isLoading}
      refetch={refetch}
      emptyText="No ledger entries found"
      renderItem={(item) => <LedgerCard item={item} />}
    />
  );
}

function CashbookTab() {
  const c = useListControls();
  const type = c.filters.type as CashType | '';
  const { data, total, stats, isLoading, refetch, add, update, remove } = useCashbook({ ...c.query, type });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CashbookEntry | null>(null);

  const onEdit = useCallback((e: CashbookEntry) => { setEditing(e); setFormOpen(true); }, []);
  const onDelete = useCallback((e: CashbookEntry) => {
    Alert.alert('Delete entry', `Delete "${e.description}" (${formatMoney(e.amount)})? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(e.id) },
    ]);
  }, [remove]);

  return (
    <>
      <ListShell
        controls={c}
        placeholder="Search description..."
        sheetTitle="Filter cashbook"
        typeOptions={CASH_TYPES}
        categories={CASH_CATEGORIES}
        tiles={
          <>
            <View style={styles.tileRow}>
              <StatTile label="Total Entries" value={String(stats.totalEntries)} icon="list-outline" />
              <StatTile label="Net Balance" value={formatMoney(stats.net)} icon="wallet-outline" tint={colors.indigo} />
            </View>
            <View style={styles.tileRow}>
              <StatTile label="Credits (In)" value={formatMoney(stats.credit)} icon="arrow-up" tint={colors.success} />
              <StatTile label="Debits (Out)" value={formatMoney(stats.debit)} icon="arrow-down" tint={colors.danger} />
            </View>
          </>
        }
        topAction={
          <Pressable style={styles.addBtn} onPress={() => { setEditing(null); setFormOpen(true); }} accessibilityLabel="Add entry">
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addText}>Add Entry</Text>
          </Pressable>
        }
        data={data}
        total={total}
        isLoading={isLoading}
        refetch={refetch}
        emptyText="No cashbook entries found"
        renderItem={(item) => <CashbookCard item={item} onEdit={onEdit} onDelete={onDelete} />}
      />
      <CashbookFormModal
        visible={formOpen}
        entry={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) update(editing.id, input);
          else add(input);
          setFormOpen(false);
        }}
      />
    </>
  );
}

export function LedgersScreen() {
  const [mode, setMode] = useState<Mode>('ledger');
  return (
    <ScreenBackground>
      <ScreenHeader title="Ledgers" subtitle="School ledger and cashbook" back />
      <View style={styles.segWrap}>
        <SegmentedControl mode={mode} onChange={setMode} />
      </View>
      {/* Both tabs stay mounted so cashbook edits survive switching. */}
      <View style={[styles.flex, mode !== 'ledger' && styles.hidden]}><LedgerTab /></View>
      <View style={[styles.flex, mode !== 'cashbook' && styles.hidden]}><CashbookTab /></View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hidden: { display: 'none' },
  segWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  tileRow: { flexDirection: 'row', gap: 10, width: '100%' },
  addBtn: {
    height: 40, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
});
