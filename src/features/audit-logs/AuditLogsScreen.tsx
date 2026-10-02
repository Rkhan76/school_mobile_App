import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius } from '../../theme/tokens';
import { ActiveFilterChips, activeFilterCount } from './ActiveFilterChips';
import { AuditDetailSheet } from './AuditDetailSheet';
import { AuditFilterSheet } from './AuditFilterSheet';
import { AuditLogCard } from './AuditLogCard';
import { EMPTY_FILTERS, parseDMY, toApiDate, type AuditFilters, type AuditLog } from './types';
import { useAuditLogs } from './useAuditLogs';

export function AuditLogsScreen() {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewing, setViewing] = useState<AuditLog | null>(null);

  const queryParams = useMemo(
    () => ({
      entityType: filters.entityType.trim() || undefined,
      action: filters.action.trim() || undefined,
      userId: filters.userId.trim() || undefined,
      fromDate: parseDMY(filters.from) !== null ? toApiDate(filters.from) : undefined,
      toDate: parseDMY(filters.to) !== null ? toApiDate(filters.to) : undefined,
    }),
    [filters]
  );

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, permissionDenied, permissionDeniedMessage } =
    useAuditLogs(queryParams);

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);
  const onView = useCallback((l: AuditLog) => setViewing(l), []);

  const applyFilters = (f: AuditFilters) => { setFilters(f); setFilterOpen(false); };
  const clearOne = (k: 'entityType' | 'action' | 'userId' | 'from' | 'to') => {
    setFilters((f) => ({ ...f, [k]: '' }));
  };

  const showSkeleton = isLoading && !refreshing && data.length === 0;
  const count = activeFilterCount(filters);

  const header = (
    <View style={styles.headerWrap}>
      <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)} accessibilityLabel="Filters">
        <Ionicons name="options-outline" size={18} color={colors.primaryDeep} />
        <Text style={styles.filterBtnText}>Filter{count ? ` (${count})` : ''}</Text>
      </Pressable>
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
            <AuditLogCard item={item} serial={index + 1} onView={onView} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons
                name={permissionDenied ? 'lock-closed-outline' : 'time-outline'}
                size={44}
                color={colors.textHint}
              />
              <Text style={styles.emptyTitle}>
                {permissionDenied ? 'Audit logs unavailable' : 'No audit logs found'}
              </Text>
              <Text style={styles.emptySub}>
                {permissionDenied ? permissionDeniedMessage : 'Try changing the filters.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
          ) : !isLoading && data.length > 0 && !hasMore ? (
            <Text style={styles.endText}>You&rsquo;ve reached the end</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
  filterBtn: {
    alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.mint, borderRadius: radius.lg,
  },
  filterBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  skeletons: { gap: 12 },
  skeleton: { height: 130, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, textAlign: 'center' },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  footerLoader: { marginVertical: 16 },
  endText: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.textHint, marginVertical: 16 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
});
