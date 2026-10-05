import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { ExamCard } from './ExamCard';
import { DEFAULT_FILTERS, ExamFilterSheet } from './ExamFilterSheet';
import { ExamFormModal } from './ExamFormModal';
import type { ExamFilters, ExamInput, ExamSchedule } from './types';
import { useExams } from './useExams';

export function ExamListTab() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canCreate = permissions.includes('exam-schedule.record.create');
  const canUpdate = permissions.includes('exam-schedule.record.update');
  const canDelete = permissions.includes('exam-schedule.record.delete');

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<ExamFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamSchedule | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, total, stats, isLoading, refetch, add, update, remove } = useExams({
    search: debounced, ...filters,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);

  const openAdd = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const onEdit = useCallback((e: ExamSchedule) => { setEditing(e); setFormOpen(true); }, []);
  const onDelete = useCallback((e: ExamSchedule) => {
    Alert.alert('Delete schedule', `Delete "${e.title}" for ${e.className} - ${e.sectionName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(e.id) },
    ]);
  }, [remove]);

  const onSubmit = useCallback(
    (input: ExamInput) => (editing ? update(editing.id, input) : add(input)),
    [editing, add, update],
  );

  const activeFilters =
    (filters.examTypeId !== 'all' ? 1 : 0) + (filters.status !== 'all' ? 1 : 0) + (filters.classId !== 'all' ? 1 : 0);
  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      {canCreate ? (
        <Pressable style={styles.addBtn} onPress={openAdd} accessibilityLabel="Add schedule">
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addText}>Add Schedule</Text>
        </Pressable>
      ) : null}
      <View style={styles.stats}>
        <StatTile label="Total Exams" value={String(stats.total)} icon="clipboard-outline" tint={colors.primary} />
        <StatTile label="Upcoming" value={String(stats.upcoming)} icon="calendar-outline" tint={colors.blue} />
      </View>
      <View style={styles.stats}>
        <StatTile label="Completed" value={String(stats.completed)} icon="checkmark-done-outline" tint={colors.orange} />
        <StatTile label="Exam Types" value={String(stats.examTypes)} icon="library-outline" tint={colors.purple} />
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchFlex}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search title, class, subject..."
            onFilterPress={() => setSheetOpen(true)}
            filterCount={activeFilters || undefined}
          />
        </View>
        <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={20} color={colors.textSecondary} />
        </Pressable>
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
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <ExamCard item={item} canEdit={canUpdate} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No exam schedules found</Text>
              <Text style={styles.emptySub}>Try changing the search or filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          !isLoading && total > 0 ? (
            <Text style={styles.footerCount}>{total} schedule{total === 1 ? '' : 's'}</Text>
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
      <ExamFilterSheet
        visible={sheetOpen}
        value={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(v) => { setFilters(v); setSheetOpen(false); }}
      />
      <ExamFormModal visible={formOpen} exam={editing} onSubmit={onSubmit} onClose={() => setFormOpen(false)} />
    </>
  );
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  addBtn: {
    height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.lg, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
  stats: { flexDirection: 'row', gap: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchFlex: { flex: 1 },
  iconBtn: {
    width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12, paddingTop: 2 },
  skeleton: { height: 170, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  footerCount: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, paddingVertical: 14 },
}));
