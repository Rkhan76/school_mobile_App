import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { AddMemberModal } from './AddMemberModal';
import { MemberCard } from './MemberCard';
import { AssignRoleSheet, MemberPermissionsSheet } from './MemberSheets';
import { useMembers, useRoles, type Member } from './mockMembers';
import { Chip, EmptyState, Pagination, SkeletonBlock } from './parts';

const PAGE_SIZE = 20;

export function MembersTab() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [roleId, setRoleId] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [assigning, setAssigning] = useState<Member | null>(null);
  const [previewing, setPreviewing] = useState<Member | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: roles } = useRoles();
  const { data, total, stats, isLoading, refetch, add, assignRole, setActive } = useMembers({
    search: debounced, roleId, page, pageSize: PAGE_SIZE,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);

  const roleNames = useMemo(() => {
    const m: Record<string, string> = {};
    roles.forEach((r) => { m[r.id] = r.name; });
    return m;
  }, [roles]);

  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);
  const onAssign = useCallback((m: Member) => setAssigning(m), []);
  const onPermissions = useCallback((m: Member) => setPreviewing(m), []);
  const onToggle = useCallback((m: Member, active: boolean) => setActive(m.id, active), [setActive]);

  const showSkeleton = isLoading && !refreshing;
  // Always read the freshest member so the sheets reflect role changes.
  const previewRole = previewing ? roles.find((r) => r.id === previewing.roleId) : undefined;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.stats}>
        <StatTile label="Total Members" value={String(stats.total)} icon="people-outline" />
        <StatTile label="Current Page" value={`${page} / ${pages}`} icon="funnel-outline" tint={colors.blue} />
        <StatTile label="Showing" value={String(data.length)} icon="shield-checkmark-outline" tint={colors.indigo} />
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or email..." />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" on={roleId === ''} onPress={() => { setRoleId(''); setPage(1); }} />
        {roles.map((r) => (
          <Chip key={r.id} label={r.name} on={roleId === r.id} onPress={() => { setRoleId(r.id); setPage(1); }} />
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <View style={styles.count}>
          <Ionicons name="people-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.countText}>{total} members</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)} accessibilityLabel="Add member">
          <Ionicons name="person-add-outline" size={16} color={colors.white} />
          <Text style={styles.addText}>Add member</Text>
        </Pressable>
      </View>

      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} height={170} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <MemberCard
              member={item}
              roleName={roleNames[item.roleId] ?? 'Unknown'}
              onAssign={onAssign}
              onPermissions={onPermissions}
              onToggle={onToggle}
            />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <EmptyState icon="people-outline" title="No members found" sub="Try changing the search or role filter." />
          )
        }
        ListFooterComponent={
          !isLoading && total > 0 ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
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

      <AddMemberModal
        visible={addOpen}
        roles={roles}
        onClose={() => setAddOpen(false)}
        onSubmit={(input) => { add(input); setAddOpen(false); setPage(1); }}
      />
      <AssignRoleSheet
        member={assigning}
        roles={roles}
        onClose={() => setAssigning(null)}
        onAssign={assignRole}
      />
      <MemberPermissionsSheet member={previewing} role={previewRole} onClose={() => setPreviewing(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  stats: { flexDirection: 'row', gap: 8 },
  chips: { gap: 8, paddingVertical: 2 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  count: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  addBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
});
