import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { AdmissionCard } from './AdmissionCard';
import { BulkBar } from './BulkBar';
import { ClassFilterSheet } from './ClassFilterSheet';
import { Pagination } from './Pagination';
import { RejectModal } from './RejectModal';
import { StatusChips, type StatusFilter } from './StatusChips';
import { useAdmissions, type Admission } from './mockAdmissions';

const PAGE_SIZE = 20;
const soon = (what: string) => Alert.alert(what, 'Coming soon.');

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export function AdmissionsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [className, setClassName] = useState('All');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectIds, setRejectIds] = useState<string[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, total, stats, isLoading, refetch, approve, reject, remove } = useAdmissions({
    search: debounced, className, status, page, pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const selectionMode = selected.length > 0;
  const toggle = useCallback((a: Admission) => {
    setSelected((s) => (s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]));
  }, []);

  const confirmApprove = useCallback((ids: string[]) => {
    Alert.alert('Approve', `Approve ${ids.length} application${ids.length > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => { approve(ids); setSelected([]); } },
    ]);
  }, [approve]);

  const handlePress = useCallback((a: Admission) => { if (selectionMode) toggle(a); }, [selectionMode, toggle]);
  const handleLong = useCallback((a: Admission) => { if (!selectionMode) setSelected([a.id]); }, [selectionMode]);
  const onApprove = useCallback((a: Admission) => confirmApprove([a.id]), [confirmApprove]);
  const onReject = useCallback((a: Admission) => setRejectIds([a.id]), []);
  const onView = useCallback((a: Admission) => soon(`View ${a.fullName}`), []);
  const onEdit = useCallback((a: Admission) => soon(`Edit ${a.fullName}`), []);
  const onDelete = useCallback((a: Admission) => {
    Alert.alert('Delete application', `Delete ${a.applicationNumber}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(a.id) },
    ]);
  }, [remove]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.stats}>
        <StatTile label="Total Applications" value={String(stats.total)} icon="document-text-outline" tint={colors.primary} />
        <StatTile label="Enrolled" value={String(stats.enrolled)} icon="checkmark-circle-outline" tint={colors.success} />
      </View>
      <View style={styles.stats}>
        <StatTile label="Pending" value={String(stats.pending)} icon="time-outline" tint={colors.warning} />
        <StatTile label="Rejected" value={String(stats.rejected)} icon="close-circle-outline" tint={colors.danger} />
      </View>
      <View style={styles.secondary}>
        <Pressable style={styles.secBtn} onPress={() => soon('Export')}>
          <Ionicons name="download-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.secText}>Export</Text>
        </Pressable>
        <Pressable style={styles.secBtn} onPress={() => soon('Generate Roll Numbers')}>
          <Ionicons name="list-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.secText} numberOfLines={1}>Generate Roll Numbers</Text>
        </Pressable>
      </View>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search applications..."
        onFilterPress={() => setSheetOpen(true)}
        filterCount={className !== 'All' ? 1 : undefined}
      />
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Admissions"
        subtitle={`${stats.total} applications`}
        back
        right={
          <>
            <Pressable style={styles.iconBtn} onPress={() => { setRefreshing(true); refetch(); }} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.newBtn} onPress={() => soon('New Admission')}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.newText}>New</Text>
            </Pressable>
          </>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={
          <>
            {header}
            <View style={styles.chipsWrap}>
              <StatusChips value={status} stats={stats} onChange={(v) => { setStatus(v); setPage(1); setSelected([]); }} />
            </View>
            {showSkeleton ? (
              <View style={styles.list}>
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <AdmissionCard
              item={item}
              selected={selected.includes(item.id)}
              selectionMode={selectionMode}
              onPress={handlePress}
              onLongPress={handleLong}
              onApprove={onApprove}
              onReject={onReject}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySub}>Try changing the search or filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          !isLoading && total > 0 ? (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              shown={data.length}
              onChange={(p) => { setPage(p); setSelected([]); }}
            />
          ) : isLoading && refreshing ? <ActivityIndicator color={colors.primary} /> : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refetch(); }} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + (selectionMode ? 100 : 32), gap: 12 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
      {selectionMode && (
        <BulkBar
          count={selected.length}
          onApprove={() => confirmApprove(selected)}
          onReject={() => setRejectIds(selected)}
          onCancel={() => setSelected([])}
        />
      )}
      <ClassFilterSheet
        visible={sheetOpen}
        value={className}
        onClose={() => setSheetOpen(false)}
        onApply={(v) => { setClassName(v); setPage(1); setSheetOpen(false); }}
      />
      <RejectModal
        visible={rejectIds !== null}
        count={rejectIds?.length ?? 0}
        onClose={() => setRejectIds(null)}
        onSubmit={(reason) => {
          if (rejectIds) reject(rejectIds, reason);
          setRejectIds(null);
          setSelected([]);
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 12 },
  stats: { flexDirection: 'row', gap: 10 },
  secondary: { flexDirection: 'row', gap: 10 },
  secBtn: {
    flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  secText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  chipsWrap: { paddingBottom: 12 },
  itemWrap: { paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, gap: 12 },
  skeleton: { height: 150, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  newBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  newText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
});
