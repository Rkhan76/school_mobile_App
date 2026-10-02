import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { BulkRequestModal } from './BulkRequestModal';
import { EMPTY_FILTERS, FilterSheet, countFilters, type RequestFilters } from './FilterSheet';
import { RequestCard } from './RequestCard';
import { Chip, EmptyState, SkeletonList } from './parts';
import { formatDate, useDocumentTypes, useRequests, type DocumentRequest } from './mockDocuments';

const PAGE_SIZE = 20;

export function RequestsTab() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<RequestFilters>(EMPTY_FILTERS);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const types = useDocumentTypes().data;

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, total, isLoading, refetch, remind, cancel, bulkCreate } = useRequests({
    search: debounced, status: filters.status, role: filters.role, typeId: filters.typeId,
    overdueOnly, page, pageSize: PAGE_SIZE,
  });

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);

  const doRefresh = useCallback(() => { setRefreshing(true); setPage(1); refetch(); }, [refetch]);

  const changeFilters = useCallback((f: RequestFilters) => { setFilters(f); setPage(1); }, []);

  const onRemind = useCallback((r: DocumentRequest) => {
    remind(r.id);
    Alert.alert('Reminder sent', `${r.personName} was reminded to upload ${r.documentName}.`);
  }, [remind]);
  const onCancel = useCallback((r: DocumentRequest) => {
    Alert.alert('Cancel request', `Cancel the ${r.documentName} request for ${r.personName}?`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => cancel(r.id) },
    ]);
  }, [cancel]);

  const showSkeleton = isLoading && !refreshing;
  const hasMore = data.length < total;

  const header = (
    <View style={styles.headerWrap}>
      <SearchBar
        value={search} onChangeText={setSearch} placeholder="Search person or document..."
        onFilterPress={() => setFilterOpen(true)} filterCount={countFilters(filters)}
      />
      <View style={styles.toolbar}>
        <Chip
          label="Overdue only" icon={overdueOnly ? 'checkmark-circle' : 'alert-circle-outline'} on={overdueOnly}
          onPress={() => { setOverdueOnly((v) => !v); setPage(1); }}
        />
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={19} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.bulkBtn} onPress={() => setBulkOpen(true)} accessibilityLabel="Bulk request">
          <Ionicons name="paper-plane-outline" size={16} color={colors.white} />
          <Text style={styles.bulkText}>Bulk Request</Text>
        </Pressable>
      </View>
      {!showSkeleton ? <Text style={styles.count}>{total} request{total === 1 ? '' : 's'}</Text> : null}
      {showSkeleton ? <SkeletonList count={4} height={230} /> : null}
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
            <RequestCard item={item} onRemind={onRemind} onCancel={onCancel} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <EmptyState icon="document-text-outline" title="No requests found" sub="Try changing the search or filters." />
          )
        }
        ListFooterComponent={hasMore && !showSkeleton ? <ActivityIndicator color={colors.primary} style={{ margin: 12 }} /> : null}
        onEndReached={() => { if (hasMore && !isLoading) setPage((p) => p + 1); }}
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
      <BulkRequestModal
        visible={bulkOpen} types={types} onClose={() => setBulkOpen(false)}
        onSubmit={(input) => {
          const { created, skipped } = bulkCreate(input);
          setBulkOpen(false);
          setPage(1);
          const extra = skipped ? ` ${skipped} skipped (already open).` : '';
          Alert.alert('Requests created', `${created} request${created === 1 ? '' : 's'} created, due ${formatDate(input.dueDate)}.${extra}`);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  bulkBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  bulkText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  count: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  itemWrap: { paddingHorizontal: 16 },
});
