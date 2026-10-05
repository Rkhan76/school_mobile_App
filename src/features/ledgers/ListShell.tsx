import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { FilterSheet } from './FilterSheet';
import { inputToIso } from './types';
import { ActiveFilterChips, EMPTY_FILTERS, ErrorNotice, activeFilterCount, type Filters } from './parts';

/** Shared filter state; yields the params the real ledger/cashbook hooks expect
 * (no `search` — neither GET /ledger nor GET /cashbook has a free-text query param). */
export function useListControls() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const applyFilters = useCallback((f: Filters) => {
    setFilters(f);
  }, []);

  return {
    filters,
    applyFilters,
    query: {
      entryType: filters.entryType || undefined,
      category: filters.category || undefined,
      dateFrom: filters.from.trim() ? inputToIso(filters.from) ?? undefined : undefined,
      dateTo: filters.to.trim() ? inputToIso(filters.to) ?? undefined : undefined,
      pageSize: filters.pageSize,
    },
  };
}

export type Controls = ReturnType<typeof useListControls>;

type Option = { value: string; label: string };

type Props<T extends { id: string }> = {
  controls: Controls;
  sheetTitle: string;
  typeOptions: Option[];
  categoryOptions: Option[];
  tiles: ReactNode;
  topAction?: ReactNode;
  data: T[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  error: string | null;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

export function ListShell<T extends { id: string }>({
  controls, sheetTitle, typeOptions, categoryOptions, tiles, topAction,
  data, total, hasMore, isLoading, isLoadingMore, loadMore, refetch, error, emptyText, renderItem,
}: Props<T>) {
  const insets = useSafeAreaInsets();
  const { filters, applyFilters } = controls;
  const [sheet, setSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const typeLabel = useCallback(
    (v: string) => typeOptions.find((o) => o.value === v)?.label ?? v,
    [typeOptions],
  );
  const categoryLabel = useCallback(
    (v: string) => categoryOptions.find((o) => o.value === v)?.label ?? v,
    [categoryOptions],
  );

  const clearChip = (k: 'entryType' | 'category' | 'from' | 'to' | 'pageSize') => {
    applyFilters({ ...filters, [k]: EMPTY_FILTERS[k] });
  };

  const showSkeleton = isLoading && !refreshing && data.length === 0;
  const showError = !isLoading && !!error && data.length === 0;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.tiles}>{tiles}</View>
      <View style={styles.actionRow}>
        <Pressable
          style={styles.filterBtn}
          onPress={() => setSheet(true)}
          accessibilityLabel="Filters"
        >
          <Ionicons name="options-outline" size={18} color={colors.primaryDeep} />
          <Text style={styles.filterText}>
            Filter{activeFilterCount(filters) ? ` (${activeFilterCount(filters)})` : ''}
          </Text>
        </Pressable>
        <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'Exporting entries is coming soon.')}>
          <Ionicons name="download-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.exportText}>Export</Text>
        </Pressable>
        {topAction}
      </View>
      <ActiveFilterChips filters={filters} typeLabel={typeLabel} categoryLabel={categoryLabel} onClear={clearChip} />
      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={showSkeleton || showError ? [] : data}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <View style={styles.itemWrap}>{renderItem(item)}</View>}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          showSkeleton ? null : showError ? (
            <ErrorNotice message={error ?? 'Something went wrong.'} onRetry={refetch} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>{emptyText}</Text>
              <Text style={styles.emptySub}>Try changing the filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !isLoading && !showError && data.length > 0 ? (
            <Text style={styles.footerInfo}>Showing {data.length} of {total} entries</Text>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
      <FilterSheet
        visible={sheet}
        title={sheetTitle}
        filters={filters}
        typeOptions={typeOptions}
        categoryOptions={categoryOptions}
        onClose={() => setSheet(false)}
        onApply={(f) => { applyFilters(f); setSheet(false); }}
      />
    </>
  );
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.mint,
  },
  filterText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  exportBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  exportText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 120, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  footerLoader: { paddingVertical: 20 },
  footerInfo: { textAlign: 'center', paddingVertical: 16, fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
}));
