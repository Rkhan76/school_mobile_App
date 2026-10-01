import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../../components/ui/Screen';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SearchBar } from '../../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../../theme/tokens';
import { useClasses, type AcademicClass, type ClassInput } from '../mockClasses';
import { ClassCard } from './ClassCard';
import { ClassFormModal } from './ClassFormModal';
import { Pagination } from './Pagination';
import { StatsGrid } from './StatsGrid';

const PAGE_SIZE = 10;

function SkeletonCard() {
  return (
    <View style={styles.skel}>
      <View style={[styles.bar, { width: 120, height: 18 }]} />
      <View style={[styles.bar, { width: 40, height: 22 }]} />
      <View style={[styles.bar, { width: '70%', height: 10 }]} />
    </View>
  );
}

function Separator() {
  return <View style={{ height: 12 }} />;
}

export function ClassesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicClass | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchText);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data, total, stats, isLoading, refetch, add, update, remove } = useClasses({
    search, page, pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  // Keep the page valid after deletes.
  useEffect(() => {
    const last = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > last) setPage(last);
  }, [total, page]);

  const onOpen = useCallback(
    (id: string) => router.push({ pathname: '/classes/[id]', params: { id } }),
    [router],
  );
  const onEdit = useCallback((c: AcademicClass) => {
    setEditing(c);
    setFormOpen(true);
  }, []);
  const onAdd = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);
  const onDelete = useCallback(
    (c: AcademicClass) => {
      Alert.alert('Delete class', `Delete ${c.name}? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(c.id) },
      ]);
    },
    [remove],
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);
  const onSubmit = useCallback(
    (input: ClassInput) => {
      if (editing) update(editing.id, input);
      else add(input);
      setFormOpen(false);
    },
    [editing, add, update],
  );

  const renderItem = useCallback(
    ({ item }: { item: AcademicClass }) => (
      <ClassCard item={item} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
    ),
    [onOpen, onEdit, onDelete],
  );

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.header}>
      <StatsGrid stats={stats} />
      <View style={styles.toolRow}>
        <Pressable style={styles.tool} onPress={() => Alert.alert('Export', 'Export coming soon')} accessibilityLabel="Export">
          <Ionicons name="download-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.toolText}>Export</Text>
        </Pressable>
        <Pressable style={styles.tool} onPress={onRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.toolText}>Refresh</Text>
        </Pressable>
      </View>
      <SearchBar value={searchText} onChangeText={setSearchText} placeholder="Search classes..." />
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Classes"
        back
        right={
          <Pressable style={styles.addBtn} onPress={onAdd} accessibilityLabel="Add class">
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addText}>Add Class</Text>
          </Pressable>
        }
      />
      <FlatList<AcademicClass>
        data={showSkeleton ? [] : data}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={40} color={colors.textHint} />
              <Text style={styles.emptyText}>No classes found</Text>
            </View>
          )
        }
        ListFooterComponent={
          showSkeleton ? null : (
            <View style={{ marginTop: 16 }}>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <ClassFormModal
        visible={formOpen}
        editing={editing}
        nextOrder={stats.totalClasses + 1}
        onSubmit={onSubmit}
        onClose={() => setFormOpen(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14, marginBottom: 14 },
  toolRow: { flexDirection: 'row', gap: 10 },
  tool: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  toolText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 12,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.white },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textSecondary },
  skel: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 12,
  },
  bar: { borderRadius: 6, backgroundColor: colors.mint },
});
