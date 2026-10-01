import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { ActiveFilterChips, activeFilterCount } from './ActiveFilterChips';
import { AuditDetailSheet } from './AuditDetailSheet';
import { AuditFilterSheet } from './AuditFilterSheet';
import { AuditLogCard } from './AuditLogCard';
import { Pagination } from './Pagination';
import { EMPTY_FILTERS, useAuditLogs, type AuditFilters, type AuditLog } from './mockAuditLogs';

export function AuditLogsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [viewing, setViewing] = useState<AuditLog | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, total, isLoading, refetch } = useAuditLogs({ ...filters, search: debounced, page });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);
  const onView = useCallback((l: AuditLog) => setViewing(l), []);

  const applyFilters = (f: AuditFilters) => { setFilters(f); setPage(1); setFilterOpen(false); };
  const clearOne = (k: 'entityType' | 'action' | 'userId' | 'from' | 'to') => {
    setFilters((f) => ({ ...f, [k]: '' }));
    setPage(1);
  };

  const showSkeleton = isLoading && !refreshing;
  const count = activeFilterCount(filters);

  const header = (
    <View style={styles.headerWrap}>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search action, entity or user..."
        onFilterPress={() => setFilterOpen(true)}
        filterCount={count}
      />
      <ActiveFilterChips filters={filters} onClear={clearOne} />
      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3, 4].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Audit Logs"
        subtitle="Track activity across the school"
        back
        right={
          <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          </Pressable>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <View style={styles.itemWrap}>
            <AuditLogCard item={item} serial={(page - 1) * filters.pageSize + index + 1} onView={onView} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No audit logs found</Text>
              <Text style={styles.emptySub}>Try changing the search or filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          !isLoading && total > 0 ? (
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

      <AuditFilterSheet visible={filterOpen} filters={filters} onClose={() => setFilterOpen(false)} onApply={applyFilters} />
      <AuditDetailSheet log={viewing} onClose={() => setViewing(null)} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 130, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
});
