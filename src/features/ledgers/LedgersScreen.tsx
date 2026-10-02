import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { CashbookFormModal } from './CashbookFormModal';
import { ListShell, useListControls } from './ListShell';
import {
  CASHBOOK_CATEGORY_OPTIONS, ENTRY_TYPE_OPTIONS, LEDGER_CATEGORY_OPTIONS, formatMoney, parseAmount,
  type CashbookEntry,
} from './types';
import { useCashbook, useLedger, type CashbookFilterParams, type LedgerFilterParams } from './useLedgerBooks';
import { CashbookCard, LedgerCard, PlanLockedNotice, SegmentedControl, type Mode } from './parts';

function LedgerTab() {
  const c = useListControls();
  const { data, total, isLoading, isLoadingMore, hasMore, loadMore, refetch, error, planLocked, summary } = useLedger(
    c.query as LedgerFilterParams,
  );

  if (planLocked) {
    return (
      <View style={styles.lockedWrap}>
        <PlanLockedNotice feature="Ledger" />
      </View>
    );
  }

  const credit = summary ? parseAmount(summary.totalCredit) : 0;
  const debit = summary ? parseAmount(summary.totalDebit) : 0;
  const net = summary ? parseAmount(summary.netBalance) : 0;

  return (
    <ListShell
      controls={c}
      sheetTitle="Filter ledger"
      typeOptions={ENTRY_TYPE_OPTIONS}
      categoryOptions={LEDGER_CATEGORY_OPTIONS}
      tiles={
        <>
          <View style={styles.tileRow}>
            <StatTile label="Total Entries" value={String(total)} icon="list-outline" />
            <StatTile label="Net Balance" value={formatMoney(net)} icon="wallet-outline" tint={colors.indigo} />
          </View>
          <View style={styles.tileRow}>
            <StatTile label="Total Credit" value={formatMoney(credit)} icon="arrow-up" tint={colors.success} />
            <StatTile label="Total Debit" value={formatMoney(debit)} icon="arrow-down" tint={colors.danger} />
          </View>
        </>
      }
      data={data}
      total={total}
      hasMore={hasMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      loadMore={loadMore}
      refetch={refetch}
      error={error}
      emptyText="No ledger entries found"
      renderItem={(item) => <LedgerCard item={item} />}
    />
  );
}

function CashbookTab() {
  const permissions = useSession((s) => s.permissions);
  const canCreate = permissions.includes('cashbook.entry.create');
  const canDelete = permissions.includes('cashbook.entry.delete');

  const c = useListControls();
  const { data, total, isLoading, isLoadingMore, hasMore, loadMore, refetch, error, planLocked, isSaving, add, remove } =
    useCashbook(c.query as CashbookFilterParams);
  const [formOpen, setFormOpen] = useState(false);

  const credit = data.reduce((sum, e) => (e.entryType === 'CREDIT' ? sum + parseAmount(e.amount) : sum), 0);
  const debit = data.reduce((sum, e) => (e.entryType === 'DEBIT' ? sum + parseAmount(e.amount) : sum), 0);

  const onDelete = useCallback(
    (e: CashbookEntry) => {
      Alert.alert(
        'Delete entry',
        `Delete "${e.description}" (${formatMoney(parseAmount(e.amount))})? This is not a true delete — it writes an offsetting reversal entry to the ledger so the trail stays intact. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => { void remove(e.id); } },
        ],
      );
    },
    [remove],
  );

  if (planLocked) {
    return (
      <View style={styles.lockedWrap}>
        <PlanLockedNotice feature="Cashbook" />
      </View>
    );
  }

  return (
    <>
      <ListShell
        controls={c}
        sheetTitle="Filter cashbook"
        typeOptions={ENTRY_TYPE_OPTIONS}
        categoryOptions={CASHBOOK_CATEGORY_OPTIONS}
        tiles={
          <>
            <View style={styles.tileRow}>
              <StatTile label="Loaded Entries" value={String(data.length)} icon="list-outline" />
              <StatTile label="Net (loaded)" value={formatMoney(credit - debit)} icon="wallet-outline" tint={colors.indigo} />
            </View>
            <View style={styles.tileRow}>
              <StatTile label="Credits (loaded)" value={formatMoney(credit)} icon="arrow-up" tint={colors.success} />
              <StatTile label="Debits (loaded)" value={formatMoney(debit)} icon="arrow-down" tint={colors.danger} />
            </View>
          </>
        }
        topAction={
          canCreate ? (
            <Pressable style={styles.addBtn} onPress={() => setFormOpen(true)} accessibilityLabel="Add entry">
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addText}>Add Entry</Text>
            </Pressable>
          ) : undefined
        }
        data={data}
        total={total}
        hasMore={hasMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        loadMore={loadMore}
        refetch={refetch}
        error={error}
        emptyText="No cashbook entries found"
        renderItem={(item) => <CashbookCard item={item} onDelete={canDelete ? onDelete : undefined} />}
      />
      {canCreate ? (
        <CashbookFormModal
          visible={formOpen}
          isSaving={isSaving}
          onClose={() => setFormOpen(false)}
          onSubmit={async (input) => {
            const ok = await add(input);
            if (ok) setFormOpen(false);
          }}
        />
      ) : null}
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
      {/* Both tabs stay mounted so cashbook state survives switching. */}
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
  lockedWrap: { flex: 1, justifyContent: 'center' },
  addBtn: {
    height: 40, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
});
