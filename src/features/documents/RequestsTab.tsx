import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { BulkRequestModal } from './BulkRequestModal';
import { EMPTY_FILTERS, FilterSheet, countFilters, type RequestFilters } from './FilterSheet';
import { RequestCard } from './RequestCard';
import { Chip, EmptyState, SkeletonList } from './parts';
import { useDocumentTypes, useRequests } from './useDocuments';
import type { DocumentRequestRow } from './types';

const PAGE_SIZE = 20;

export function RequestsTab() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canCreate = permissions.includes('document-request.record.create');
  const canUpdate = permissions.includes('document-request.record.update');

  const [filters, setFilters] = useState<RequestFilters>(EMPTY_FILTERS);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const types = useDocumentTypes().data;

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, remind, cancel, bulkCreate } = useRequests({
    status: filters.status, entityType: filters.entityType, documentTypeId: filters.documentTypeId,
    overdueOnly, pageSize: PAGE_SIZE,
  });

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);

  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);

  const changeFilters = useCallback((f: RequestFilters) => { setFilters(f); }, []);

  const onRemind = useCallback((r: DocumentRequestRow) => {
    remind(r.id);
    Alert.alert('Reminder sent', `A reminder was sent for ${r.documentTypeName}.`);
  }, [remind]);
  const onCancel = useCallback((r: DocumentRequestRow) => {
    Alert.alert('Cancel request', `Cancel the ${r.documentTypeName} request?`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => cancel(r.id) },
    ]);
  }, [cancel]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.toolbar}>
        <Pressable style={styles.iconBtn} onPress={() => setFilterOpen(true)} accessibilityLabel="Filter">
          <Ionicons name="filter" size={18} color={colors.textSecondary} />
          {countFilters(filters) > 0 ? <View style={styles.filterDot} /> : null}
        </Pressable>
        <Chip
          label="Overdue only" icon={overdueOnly ? 'checkmark-circle' : 'alert-circle-outline'} on={overdueOnly}
          onPress={() => setOverdueOnly((v) => !v)}
        />
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={19} color={colors.textSecondary} />
        </Pressable>
        {canCreate ? (
          <Pressable style={styles.bulkBtn} onPress={() => setBulkOpen(true)} accessibilityLabel="Bulk request">
            <Ionicons name="paper-plane-outline" size={16} color={colors.white} />
            <Text style={styles.bulkText}>Bulk Request</Text>
          </Pressable>
        ) : null}
      </View>
      {!showSkeleton ? <Text style={styles.count}>{data.length} request{data.length === 1 ? '' : 's'}</Text> : null}
      {showSkeleton ? <SkeletonList count={4} height={190} /> : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <RequestCard item={item} canUpdate={canUpdate} onRemind={onRemind} onCancel={onCancel} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <EmptyState icon="document-text-outline" title="No requests found" sub="Try changing the filters." />
          )
        }
        ListFooterComponent={hasMore && !showSkeleton ? <ActivityIndicator color={colors.primary} style={{ margin: 12 }} /> : null}
        onEndReached={() => { if (hasMore && !isLoading && !isLoadingMore) loadMore(); }}
        onEndReachedThreshold={0.4}
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
        visible={filterOpen} filters={filters} types={types} onChange={changeFilters} onClose={() => setFilterOpen(false)}
      />
      {canCreate ? (
        <BulkRequestModal
          visible={bulkOpen} types={types} onClose={() => setBulkOpen(false)}
          onSubmit={async (input) => {
            setBulkOpen(false);
            const result = await bulkCreate(input);
            if (!result) return;
            const extra = result.failed.length ? ` ${result.failed.length} failed.` : '';
            Alert.alert('Requests created', `${result.succeeded.length} request${result.succeeded.length === 1 ? '' : 's'} created.${extra}`);
          }}
        />
      ) : null}
    </>
  );
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  filterDot: {
    position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary,
  },
  bulkBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  bulkText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  count: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  itemWrap: { paddingHorizontal: 16 },
}));
