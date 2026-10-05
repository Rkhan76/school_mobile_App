import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../../components/ui/Screen';
import { SearchBar } from '../../../components/ui/SearchBar';
import { AppBar } from '../../dashboard/AppBar';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import { useSession } from '../../auth/session';
import { useStudents, type StudentRow } from '../useStudents';
import { StatsGrid } from './StatsGrid';
import { StudentCard } from './StudentCard';
import { StudentFilterSheet, type StudentFilters } from './StudentFilterSheet';

const TAB_BAR_SPACE = 120;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function SkeletonCard() {
  return (
    <View style={styles.skel}>
      <View style={[styles.bar, { width: 120, height: 20 }]} />
      <View style={styles.skelRow}>
        <View style={styles.skelAvatar} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={[styles.bar, { width: '60%', height: 14 }]} />
          <View style={[styles.bar, { width: '85%', height: 10 }]} />
        </View>
      </View>
      <View style={[styles.bar, { width: '70%', height: 10 }]} />
    </View>
  );
}

function Separator() {
  return <View style={{ height: 12 }} />;
}

export function StudentListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canToggleStatus = permissions.includes('student.status.update');
  const canToggleBlock = permissions.includes('student.profile.delete');

  const [searchText, setSearchText] = useState('');
  const search = useDebounced(searchText, 300);
  const [filters, setFilters] = useState<StudentFilters>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, stats, toggleStatus, toggleBlock } = useStudents({
    search, classId: filters.classId, sectionId: filters.sectionId, blocked: showBlocked,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const filterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const onView = useCallback(
    (id: string) => router.push({ pathname: '/student/[id]', params: { id } }),
    [router],
  );
  const onToggle = useCallback(
    async (id: string) => {
      const ok = await toggleStatus(id);
      if (!ok) {
        Alert.alert(
          'Cannot change status',
          'This student’s enrollment status is graduated, transferred or withdrawn, so active/inactive cannot be toggled.',
        );
      }
    },
    [toggleStatus],
  );
  const onBlock = useCallback(
    (id: string) => {
      const verb = showBlocked ? 'Unblock' : 'Block';
      Alert.alert(
        `${verb} student`,
        showBlocked
          ? 'This will restore the student record and their portal login. Continue?'
          : 'This will deactivate the student record and revoke their portal login (and their guardians’ access to it). Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: verb,
            style: showBlocked ? 'default' : 'destructive',
            onPress: async () => {
              const ok = await toggleBlock(id);
              if (!ok) Alert.alert('Something went wrong', `Could not ${verb.toLowerCase()} this student. Please try again.`);
            },
          },
        ],
      );
    },
    [toggleBlock, showBlocked],
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: StudentRow }) => (
      <StudentCard
        student={item}
        onView={onView}
        onToggleStatus={onToggle}
        onToggleBlock={onBlock}
        canToggleStatus={canToggleStatus}
        canToggleBlock={canToggleBlock}
        blocked={showBlocked}
      />
    ),
    [onView, onToggle, onBlock, canToggleStatus, canToggleBlock, showBlocked],
  );

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.header}>
      <AppBar academicYear="2026-2027" hasUnread={false} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Student List</Text>
        <Pressable style={styles.refresh} onPress={onRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>
      <StatsGrid stats={stats} />
      <View style={styles.segment}>
        {([false, true] as const).map((isBlocked) => (
          <Pressable
            key={String(isBlocked)}
            style={[styles.segmentItem, showBlocked === isBlocked && styles.segmentItemActive]}
            onPress={() => setShowBlocked(isBlocked)}
            accessibilityRole="tab"
            accessibilityState={{ selected: showBlocked === isBlocked }}
          >
            <Text style={[styles.segmentText, showBlocked === isBlocked && styles.segmentTextActive]}>
              {isBlocked ? 'Blocked' : 'Active'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search students..."
            onFilterPress={() => setSheetOpen(true)}
            filterCount={filterCount}
          />
        </View>
        <Pressable
          style={styles.export}
          onPress={() => Alert.alert('Export', 'Export coming soon')}
          accessibilityLabel="Export"
        >
          <Ionicons name="download-outline" size={20} color={colors.primaryDeep} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenBackground>
      <FlatList<StudentRow>
        data={showSkeleton ? [] : data}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Separator}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="school-outline" size={40} color={colors.textHint} />
              <Text style={styles.emptyText}>{showBlocked ? 'No blocked students' : 'No students found'}</Text>
            </View>
          )
        }
        ListFooterComponent={
          !showSkeleton && isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: TAB_BAR_SPACE + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
      />
      <StudentFilterSheet
        visible={sheetOpen}
        value={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setSheetOpen(false);
        }}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  header: { gap: 14, marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.text },
  refresh: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  refreshText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  segment: {
    flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border,
  },
  segmentItem: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  segmentTextActive: { color: colors.white },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  export: {
    width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textSecondary },
  footerLoader: { paddingVertical: 20 },
  skel: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 14,
  },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skelAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.mint },
  bar: { borderRadius: 6, backgroundColor: colors.mint },
}));
