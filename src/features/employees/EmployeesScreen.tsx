import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, spacing, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { EmployeeFormSheet } from './EmployeeFormSheet';
import { FilterSheet, type EmployeeFilters } from './FilterSheet';
import { CardSkeleton, EmptyState, useDebounced } from './ListStates';
import { SegmentedTabs } from './SegmentedTabs';
import { StaffCard } from './StaffCard';
import { TeacherCard } from './TeacherCard';
import { PAGE_SIZE, useNonTeachingStaff, useTeachers } from './useEmployees';
import type { EmployeeStatus, NTSListItem, TeacherEntity } from './types';

const TABS = ['Teachers', 'Non-Teaching Staff'] as const;
type Tab = (typeof TABS)[number];

function comingSoon(what: string) {
  Alert.alert('Coming soon', `${what} will be available soon.`);
}

/**
 * Setting INACTIVE/TERMINATED immediately kills the portal login + sessions;
 * reactivating to ACTIVE does NOT auto-restore the login (admin must re-invite
 * separately). Surface both gotchas before the status actually changes.
 */
function confirmStatusChange(name: string, next: EmployeeStatus, onConfirm: () => void) {
  const message =
    next === 'ACTIVE'
      ? `Reactivating ${name} will NOT automatically restore their portal login — you'll need to separately re-invite them to set a new password. Continue?`
      : `Setting ${name} to ${next} will immediately deactivate their portal login and end all active sessions. Continue?`;
  Alert.alert('Change status', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue', style: next === 'ACTIVE' ? 'default' : 'destructive', onPress: onConfirm },
  ]);
}

function confirmBlock(name: string, onConfirm: () => void) {
  Alert.alert(
    'Block profile',
    `Block ${name}? This deactivates their profile and portal login and revokes all active sessions. They can be unblocked later. Continue?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: onConfirm },
    ]
  );
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

function TeachersList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canCreate = permissions.includes('teacher.profile.create');
  const canUpdateStatus = permissions.includes('teacher.status.update');
  const canToggleBlock = permissions.includes('teacher.profile.delete');

  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [sheet, setSheet] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, stats, setStatus, toggleBlock, create } = useTeachers({
    search: debounced,
    pageSize: PAGE_SIZE,
    gender: filters.gender,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const filterCount = Object.values(filters).filter(Boolean).length;

  const header = (
    <View style={styles.header}>
      <View style={styles.statRow}>
        <StatTile label="Total" value={String(stats.total)} icon="people-outline" />
        <StatTile label="Male" value={String(stats.male)} icon="male-outline" tint={colors.blue} />
      </View>
      <View style={styles.statRow}>
        <StatTile label="Female" value={String(stats.female)} icon="female-outline" tint={colors.purple} />
        <StatTile label="Assigned to Class" value={String(stats.assignedToClass)} icon="school-outline" tint={colors.orange} />
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search teachers" onFilterPress={() => setSheet(true)} filterCount={filterCount} />
    </View>
  );

  return (
    <>
      <FlatList<TeacherEntity>
        data={isLoading ? [] : data}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TeacherCard
            teacher={item}
            onView={(t) => router.push({ pathname: '/teacher/[id]', params: { id: t.id } })}
            onToggleStatus={(t, next) => confirmStatusChange(t.fullName, next, () => setStatus(t.id, next))}
            onToggleBlock={(t) => confirmBlock(t.fullName, () => toggleBlock(t.id))}
            canUpdateStatus={canUpdateStatus}
            canToggleBlock={canToggleBlock}
          />
        )}
        ListHeaderComponent={
          <>
            {header}
            {canCreate ? (
              <Pressable style={styles.addBtn} onPress={() => setFormVisible(true)}>
                <Ionicons name="add-circle-outline" size={18} color={colors.white} />
                <Text style={styles.addBtnText}>Add Teacher</Text>
              </Pressable>
            ) : null}
          </>
        }
        ListEmptyComponent={
          isLoading ? <Skeletons /> : <EmptyState title="No teachers found" hint="Try a different search or clear the filters." />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
          ) : !isLoading && data.length > 0 && !hasMore ? (
            <Text style={styles.endText}>You've reached the end</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refetch(); }} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <FilterSheet visible={sheet} title="Filter teachers" value={filters} onApply={setFilters} onClose={() => setSheet(false)} />
      <EmployeeFormSheet visible={formVisible} kind="teacher" onSubmit={(p) => create(p as Parameters<typeof create>[0])} onClose={() => setFormVisible(false)} />
    </>
  );
}

function StaffList() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canCreate = permissions.includes('non-teaching-staff.profile.create');
  const canUpdateStatus = permissions.includes('non-teaching-staff.profile.update');
  const canToggleBlock = permissions.includes('non-teaching-staff.profile.delete');

  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [sheet, setSheet] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, stats, setStatus, toggleBlock, create } = useNonTeachingStaff({
    search: debounced,
    pageSize: PAGE_SIZE,
    gender: filters.gender,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const filterCount = Object.values(filters).filter(Boolean).length;

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
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search staff" onFilterPress={() => setSheet(true)} filterCount={filterCount} />
    </View>
  );

  return (
    <>
      <FlatList<NTSListItem>
        data={isLoading ? [] : data}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <StaffCard
            staff={item}
            onPress={() => comingSoon('Staff details')}
            onToggleStatus={(s, next) => confirmStatusChange(s.fullName, next, () => setStatus(s.id, next))}
            onToggleBlock={(s) => confirmBlock(s.fullName, () => toggleBlock(s.id))}
            canUpdateStatus={canUpdateStatus}
            canToggleBlock={canToggleBlock}
          />
        )}
        ListHeaderComponent={
          <>
            {header}
            {canCreate ? (
              <Pressable style={styles.addBtn} onPress={() => setFormVisible(true)}>
                <Ionicons name="add-circle-outline" size={18} color={colors.white} />
                <Text style={styles.addBtnText}>Add Staff</Text>
              </Pressable>
            ) : null}
          </>
        }
        ListEmptyComponent={isLoading ? <Skeletons /> : <EmptyState title="No staff found" hint="Try a different search." />}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
          ) : !isLoading && data.length > 0 && !hasMore ? (
            <Text style={styles.endText}>You've reached the end</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refetch(); }} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <FilterSheet visible={sheet} title="Filter staff" value={filters} onApply={setFilters} onClose={() => setSheet(false)} />
      <EmployeeFormSheet visible={formVisible} kind="staff" onSubmit={(p) => create(p as Parameters<typeof create>[0])} onClose={() => setFormVisible(false)} />
    </>
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

const styles = themed(() => StyleSheet.create({
  tabs: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  content: { paddingHorizontal: spacing.lg, paddingTop: 4 },
  header: { gap: spacing.md, paddingBottom: spacing.lg },
  statRow: { flexDirection: 'row', gap: spacing.md },
  export: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.mint },
  exportText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 14, backgroundColor: colors.primary, marginBottom: spacing.md },
  addBtnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
  footerLoader: { marginVertical: 20 },
  endText: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.textHint, marginVertical: 16 },
}));
