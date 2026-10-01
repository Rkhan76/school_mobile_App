import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, spacing } from '../../theme/tokens';
import { FilterSheet, type TeacherFilters } from './FilterSheet';
import { CardSkeleton, EmptyState, ErrorState, useDebounced } from './ListStates';
import { PAGE_SIZE, useNonTeachingStaff, useTeachers, type NonTeachingStaff, type Teacher } from './mockEmployees';
import { Pagination } from './Pagination';
import { SegmentedTabs } from './SegmentedTabs';
import { StaffCard } from './StaffCard';
import { TeacherCard } from './TeacherCard';

const TABS = ['Teachers', 'Non-Teaching Staff'] as const;
type Tab = (typeof TABS)[number];

function comingSoon(what: string) {
  Alert.alert('Coming soon', `${what} will be available soon.`);
}

function confirmDelete(name: string, onConfirm: () => void) {
  Alert.alert('Delete employee', `Remove ${name}? This cannot be undone.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export function EmployeesScreen() {
  const [tab, setTab] = useState<Tab>('Teachers');
  return (
    <ScreenBackground>
      <ScreenHeader
        title="Employees"
        back
        right={
          <Pressable style={styles.export} onPress={() => comingSoon('Export')} accessibilityLabel="Export">
            <Ionicons name="download-outline" size={18} color={colors.primaryDeep} />
            <Text style={styles.exportText}>Export</Text>
          </Pressable>
        }
      />
      <View style={styles.tabs}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      </View>
      {tab === 'Teachers' ? <TeachersList /> : <StaffList />}
    </ScreenBackground>
  );
}

function useListChrome(extraResetKey: string) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search, 300);
  useEffect(() => setPage(1), [debounced, extraResetKey]);
  return { insets, search, setSearch, debounced, page, setPage };
}

function TeachersList() {
  const router = useRouter();
  const [filters, setFilters] = useState<TeacherFilters>({});
  const [sheet, setSheet] = useState(false);
  const { insets, search, setSearch, debounced, page, setPage } = useListChrome(JSON.stringify(filters));
  const { data, total, stats, isLoading, error, refetch, setActive, remove } = useTeachers({
    search: debounced,
    page,
    pageSize: PAGE_SIZE,
    ...filters,
  });
  const filterCount = Object.values(filters).filter(Boolean).length;

  const header = (
    <View style={styles.header}>
      <View style={styles.statRow}>
        <StatTile label="Total" value={String(stats.total)} icon="people-outline" />
        <StatTile label="Male" value={String(stats.male)} icon="male-outline" tint={colors.blue} />
      </View>
      <View style={styles.statRow}>
        <StatTile label="Female" value={String(stats.female)} icon="female-outline" tint={colors.purple} />
        <StatTile label="Assigned to Class" value={String(stats.assigned)} icon="school-outline" tint={colors.orange} />
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search teachers" onFilterPress={() => setSheet(true)} filterCount={filterCount} />
    </View>
  );

  return (
    <>
      <FlatList<Teacher>
        data={isLoading ? [] : data}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TeacherCard
            teacher={item}
            onView={(t) => router.push({ pathname: '/teacher/[id]', params: { id: t.id } })}
            onToggle={(t, a) => setActive(t.id, a)}
            onDelete={(t) => confirmDelete(t.fullName, () => remove(t.id))}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? <Skeletons /> : error ? <ErrorState message={error} onRetry={refetch} /> : <EmptyState title="No teachers found" hint="Try a different search or clear the filters." />
        }
        ListFooterComponent={!isLoading && !error && total > 0 ? <Pagination page={page} pageSize={PAGE_SIZE} total={total} shown={data.length} onChange={setPage} /> : null}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <FilterSheet visible={sheet} value={filters} onApply={setFilters} onClose={() => setSheet(false)} />
    </>
  );
}

function StaffList() {
  const { insets, search, setSearch, debounced, page, setPage } = useListChrome('');
  const { data, total, stats, isLoading, error, refetch, setActive, remove } = useNonTeachingStaff({
    search: debounced,
    page,
    pageSize: PAGE_SIZE,
  });

  const header = (
    <View style={styles.header}>
      <View style={styles.statRow}>
        <StatTile label="Total" value={String(stats.total)} icon="people-outline" />
        <StatTile label="Male" value={String(stats.male)} icon="male-outline" tint={colors.blue} />
      </View>
      <View style={styles.statRow}>
        <StatTile label="Female" value={String(stats.female)} icon="female-outline" tint={colors.purple} />
        <StatTile label="Active" value={String(stats.active)} icon="checkmark-circle-outline" tint={colors.success} />
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search staff" />
    </View>
  );

  return (
    <FlatList<NonTeachingStaff>
      data={isLoading ? [] : data}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => (
        <StaffCard
          staff={item}
          onPress={() => comingSoon('Staff details')}
          onToggle={(s, a) => setActive(s.id, a)}
          onDelete={(s) => confirmDelete(s.fullName, () => remove(s.id))}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isLoading ? <Skeletons /> : error ? <ErrorState message={error} onRetry={refetch} /> : <EmptyState title="No staff found" hint="Try a different search." />
      }
      ListFooterComponent={!isLoading && !error && total > 0 ? <Pagination page={page} pageSize={PAGE_SIZE} total={total} shown={data.length} onChange={setPage} /> : null}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      ItemSeparatorComponent={Separator}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
}

function Separator() {
  return <View style={{ height: spacing.md }} />;
}

function Skeletons() {
  return (
    <View style={{ gap: spacing.md }}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  content: { paddingHorizontal: spacing.lg, paddingTop: 4 },
  header: { gap: spacing.md, paddingBottom: spacing.lg },
  statRow: { flexDirection: 'row', gap: spacing.md },
  export: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.mint },
  exportText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
});
