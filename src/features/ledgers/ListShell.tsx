import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { FilterSheet } from './FilterSheet';
import { inputToIso } from './mockLedgers';
import { ActiveFilterChips, EMPTY_FILTERS, Pagination, activeFilterCount, type Filters } from './parts';

/** Shared search / filter / page state; yields the ISO params the mock hooks expect. */
export function useListControls() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const applyFilters = useCallback((f: Filters) => {
    setFilters(f);
    setPage(1);
  }, []);

  return {
    search, setSearch, filters, applyFilters, page, setPage,
    query: {
      search: debounced,
      category: filters.category,
      from: filters.from.trim() ? inputToIso(filters.from) ?? '' : '',
      to: filters.to.trim() ? inputToIso(filters.to) ?? '' : '',
      page,
      pageSize: filters.pageSize,
    },
  };
}

export type Controls = ReturnType<typeof useListControls>;

type Props<T extends { id: string }> = {
  controls: Controls;
  placeholder: string;
  sheetTitle: string;
  typeOptions: { value: string; label: string }[];
  categories: string[];
  tiles: ReactNode;
  topAction?: ReactNode;
  data: T[];
  total: number;
  isLoading: boolean;
  refetch: () => void;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
};

export function ListShell<T extends { id: string }>({
  controls, placeholder, sheetTitle, typeOptions, categories, tiles, topAction,
  data, total, isLoading, refetch, emptyText, renderItem,
}: Props<T>) {
  const insets = useSafeAreaInsets();
  const { search, setSearch, filters, applyFilters, page, setPage } = controls;
  const [sheet, setSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  // Deleting the last item on a page would leave it empty.
  useEffect(() => {
    const pages = Math.max(1, Math.ceil(total / filters.pageSize));
    if (page > pages) setPage(pages);
  }, [total, page, filters.pageSize, setPage]);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const typeLabel = useCallback(
    (v: string) => typeOptions.find((o) => o.value === v)?.label ?? v,
    [typeOptions],
  );

  const clearChip = (k: 'type' | 'category' | 'from' | 'to' | 'pageSize') => {
    applyFilters({ ...filters, [k]: EMPTY_FILTERS[k] });
  };

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.tiles}>{tiles}</View>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={placeholder}
        onFilterPress={() => setSheet(true)}
        filterCount={activeFilterCount(filters)}
      />
      <ActiveFilterChips filters={filters} typeLabel={typeLabel} onClear={clearChip} />
      <View style={styles.actionRow}>
        <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'Exporting entries is coming soon.')}>
          <Ionicons name="download-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.exportText}>Export</Text>
        </Pressable>
        {topAction}
      </View>
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
        data={showSkeleton ? [] : data}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <View style={styles.itemWrap}>{renderItem(item)}</View>}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>{emptyText}</Text>
              <Text style={styles.emptySub}>Try changing the search or filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          !isLoading ? (
            <Pagination page={page} pageSize={filters.pageSize} total={total} onChange={setPage} />
          ) : isLoading && refreshing ? <ActivityIndicator color={colors.primary} /> : null
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
        categories={categories}
        onClose={() => setSheet(false)}
        onApply={(f) => { applyFilters(f); setSheet(false); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
});
