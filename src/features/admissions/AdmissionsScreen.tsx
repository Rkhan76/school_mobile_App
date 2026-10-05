import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { AdmissionCard } from './AdmissionCard';
import { BulkBar } from './BulkBar';
import { ClassFilterSheet, type ClassOption } from './ClassFilterSheet';
import { RejectModal } from './RejectModal';
import { StatusChips, type StatusFilter } from './StatusChips';
import { useAdmissions } from './useAdmissions';
import type { AdmissionListItem } from './types';

const PAGE_SIZE = 20;
const soon = (what: string) => Alert.alert(what, 'Coming soon.');

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export function AdmissionsScreen() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [classOption, setClassOption] = useState<ClassOption>(null);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectIds, setRejectIds] = useState<string[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const canCreate = permissions.includes('admission.application.create');
  const canUpdate = permissions.includes('admission.application.update');
  const canApprovePerm = permissions.includes('admission.approval.update');
  const canRejectPerm = permissions.includes('admission.rejection.update');
  const canCancelPerm = permissions.includes('admission.cancellation.update');
  const canDeletePerm = permissions.includes('admission.application.delete');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, stats, isLoading, isLoadingMore, hasMore, loadMore, refetch, approve, reject, cancelOne, remove } = useAdmissions({
    search: debounced, className: classOption?.name ?? 'All', classId: classOption?.id ?? 'all', status, pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const selectionMode = selected.length > 0;
  const toggle = useCallback((a: AdmissionListItem) => {
    setSelected((s) => (s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]));
  }, []);

  const confirmApprove = useCallback((ids: string[]) => {
    Alert.alert(
      'Approve application' + (ids.length > 1 ? 's' : ''),
      `This will immediately create the student's portal login and enroll ${ids.length > 1 ? 'them' : 'the student'}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => { approve(ids); setSelected([]); } },
      ]
    );
  }, [approve]);

  // Tapping a card opens its detail; while selecting, a tap toggles the selection instead.
  const handlePress = useCallback(
    (a: AdmissionListItem) => { if (selectionMode) toggle(a); else router.push(`/admissions/${a.id}`); },
    [selectionMode, toggle, router],
  );
  const handleLong = useCallback((a: AdmissionListItem) => { if (!selectionMode) setSelected([a.id]); }, [selectionMode]);
  const onApprove = useCallback((a: AdmissionListItem) => confirmApprove([a.id]), [confirmApprove]);
  const onReject = useCallback((a: AdmissionListItem) => setRejectIds([a.id]), []);
  const onCancelItem = useCallback((a: AdmissionListItem) => {
    Alert.alert('Cancel application?', `Cancel application ${a.admissionNumber}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Cancel Application', style: 'destructive', onPress: () => cancelOne(a.id) },
    ]);
  }, [cancelOne]);
  const onEdit = useCallback((a: AdmissionListItem) => router.push(`/admissions/${a.id}/edit`), []);
  const onDelete = useCallback((a: AdmissionListItem) => {
    if (a.status === 'pending') {
      Alert.alert('Delete application', `Delete ${a.admissionNumber}? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(a.id) },
      ]);
      return;
    }
    Alert.alert(
      'Delete application',
      `This application is already ${a.status} — deleting it cannot be undone and will not affect the student record it created. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm delete', `Permanently delete ${a.admissionNumber}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => remove(a.id) },
            ]);
          },
        },
      ]
    );
  }, [remove]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.stats}>
        <StatTile label="Total Applications" value={String(stats.totalApplications)} icon="document-text-outline" tint={colors.primary} />
        <StatTile label="Enrolled" value={String(stats.enrolled)} icon="checkmark-circle-outline" tint={colors.success} />
      </View>
      <View style={styles.stats}>
        <StatTile label="Pending" value={String(stats.pending)} icon="time-outline" tint={colors.warning} />
        <StatTile label="Rejected" value={String(stats.rejected)} icon="close-circle-outline" tint={colors.danger} />
      </View>
      <View style={styles.secondary}>
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
        filterCount={classOption ? 1 : undefined}
      />
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Admissions"
        subtitle={`${stats.totalApplications} applications`}
        back
        right={
          <>
            <Pressable style={styles.iconBtn} onPress={() => { setRefreshing(true); refetch(); }} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
            {canCreate && (
              <Pressable style={styles.newBtn} onPress={() => router.push('/admissions/new')}>
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newText}>New</Text>
              </Pressable>
            )}
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
              <StatusChips value={status} stats={stats} onChange={(v) => { setStatus(v); setSelected([]); }} />
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
              canApprove={canApprovePerm}
              canReject={canRejectPerm}
              canCancel={canCancelPerm}
              canEdit={canUpdate}
              canDelete={canDeletePerm}
              onPress={handlePress}
              onLongPress={handleLong}
              onApprove={onApprove}
              onReject={onReject}
              onCancel={onCancelItem}
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
          isLoadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
          ) : !showSkeleton && data.length > 0 && !hasMore ? (
            <Text style={styles.endText}>You've reached the end</Text>
          ) : isLoading && refreshing ? (
            <ActivityIndicator color={colors.primary} />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
          canApprove={canApprovePerm}
          canReject={canRejectPerm}
          onApprove={() => confirmApprove(selected)}
          onReject={() => setRejectIds(selected)}
          onCancel={() => setSelected([])}
        />
      )}
      <ClassFilterSheet
        visible={sheetOpen}
        value={classOption}
        onClose={() => setSheetOpen(false)}
        onApply={(v) => { setClassOption(v); setSheetOpen(false); }}
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

const styles = themed(() => StyleSheet.create({
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
  footerLoader: { paddingVertical: 16 },
  endText: { textAlign: 'center', paddingVertical: 16, fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  newBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  newText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
}));
