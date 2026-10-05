import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { CollectPaymentModal } from './CollectPaymentModal';
import { InvoiceCard } from './InvoiceCard';
import { InvoiceDetailSheet } from './InvoiceDetailSheet';
import { EMPTY_FILTERS, InvoiceFilterSheet, type InvoiceFilters } from './InvoiceFilterSheet';
import { ReceiptSheet } from './ReceiptSheet';
import { EmptyState, SkeletonCard } from './parts';
import { parseDMY, useInvoices, type Invoice, type Receipt } from './mockFees';

const PAGE_SIZE = 10;
const TAB_BAR_SPACE = 120;

type Collect = { open: boolean; studentId: string | null; invoiceId: string | null };

export function CollectionTab({ top }: { top: ReactElement }) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [collect, setCollect] = useState<Collect>({ open: false, studentId: null, invoiceId: null });
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchText); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data, total, stats, isLoading, refetch, byId } = useInvoices({
    search,
    student: filters.student,
    classId: filters.classId,
    status: filters.status,
    dueDate: filters.dueDate ? parseDMY(filters.dueDate) ?? undefined : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);

  const filterCount = useMemo(
    () => [filters.student, filters.classId, filters.status, filters.dueDate].filter(Boolean).length,
    [filters],
  );

  const onRefresh = useCallback(() => { setRefreshing(true); setPage(1); refetch(); }, [refetch]);
  const openDetail = useCallback((id: string) => setDetailId(id), []);
  const renderItem = useCallback(
    ({ item }: { item: Invoice }) => <InvoiceCard invoice={item} onPress={openDetail} />,
    [openDetail],
  );

  const detail = detailId ? byId(detailId) : null;

  const startCollect = (studentId: string | null, invoiceId: string | null, delay: number) => {
    setTimeout(() => setCollect({ open: true, studentId, invoiceId }), delay);
  };

  const showSkeleton = isLoading && !refreshing;
  const hasMore = data.length < total;
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const header = (
    <View style={styles.header}>
      {top}
      <Pressable style={styles.collectBtn} onPress={() => startCollect(null, null, 0)} accessibilityRole="button">
        <Ionicons name="card-outline" size={18} color={colors.white} />
        <Text style={styles.collectText}>Collect Payment</Text>
      </Pressable>
      <View style={styles.row}>
        <StatTile label="Total Invoices" value={String(stats.total)} icon="document-text-outline" tint={colors.primaryDeep} />
        <StatTile label="Issued" value={String(stats.issued)} icon="wallet-outline" tint={colors.blue} />
      </View>
      <View style={styles.row}>
        <StatTile label="Overdue" value={String(stats.overdue)} icon="alert-circle-outline" tint={colors.danger} />
        <StatTile label="Paid" value={String(stats.paid)} icon="trending-up-outline" tint={colors.success} />
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={searchText} onChangeText={setSearchText} placeholder="Search invoice #..."
            onFilterPress={() => setFilterOpen(true)} filterCount={filterCount}
          />
        </View>
        <Pressable style={styles.export} onPress={() => Alert.alert('Export', 'Export coming soon')} accessibilityLabel="Export">
          <Ionicons name="download-outline" size={20} color={colors.primaryDeep} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <FlatList<Invoice>
        data={showSkeleton ? [] : data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={{ gap: 12 }}>{[0, 1, 2].map((k) => <SkeletonCard key={k} height={190} />)}</View>
          ) : (
            <EmptyState icon="receipt-outline" title="No invoices found" sub="Try changing the search or filters." />
          )
        }
        ListFooterComponent={
          showSkeleton ? null : isLoading && page > 1 ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
          ) : !hasMore && data.length > 0 ? (
            <Text style={styles.endText}>You've reached the end</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={5}
        windowSize={7}
      />

      <InvoiceFilterSheet
        visible={filterOpen} value={filters} onClose={() => setFilterOpen(false)}
        onApply={(f) => { setFilters(f); setPage(1); setFilterOpen(false); }}
      />
      <InvoiceDetailSheet
        invoice={detail}
        onClose={() => setDetailId(null)}
        onCollect={(inv) => { setDetailId(null); startCollect(inv.studentId, inv.id, 350); }}
      />
      <CollectPaymentModal
        visible={collect.open}
        initialStudentId={collect.studentId}
        initialInvoiceId={collect.invoiceId}
        onClose={() => setCollect((c) => ({ ...c, open: false }))}
        onDone={(r) => {
          setCollect((c) => ({ ...c, open: false }));
          setTimeout(() => setReceipt(r), 350);
        }}
      />
      <ReceiptSheet receipt={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}

function Separator() {
  return <View style={{ height: 12 }} />;
}

const styles = themed(() => StyleSheet.create({
  header: { gap: 12, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  collectBtn: {
    height: 48, borderRadius: radius.lg, backgroundColor: colors.primaryDeep, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  collectText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.white },
  endText: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.textHint, marginVertical: 16 },
  export: {
    width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
}));
