import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { AddCategoryModal } from './AddCategoryModal';
import { CategoryChips } from './CategoryChips';
import { DocumentCard } from './DocumentCard';
import { DocumentFormModal } from './DocumentFormModal';
import { DEFAULT_FILTERS, FilterSheet, type DocFilters } from './FilterSheet';
import { VersionsSheet } from './VersionsSheet';
import { ALL_CATEGORY_ID, useSchoolDocuments, type DocumentVersion, type SchoolDocument } from './mockSchoolDocuments';

export function SchoolDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState(ALL_CATEGORY_ID);
  const [filters, setFilters] = useState<DocFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolDocument | null>(null);
  const [versionsId, setVersionsId] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, total, categories, isLoading, refetch, add, update, remove, restore, addCategory } = useSchoolDocuments({
    search: debounced, categoryId, confidentiality: filters.confidentiality, expiry: filters.expiry,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const categoryNames = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);
  const realCategories = useMemo(() => categories.filter((c) => c.id !== ALL_CATEGORY_ID), [categories]);

  // Versions sheet reads the live document so restore shows immediately.
  const versionsDoc = useMemo(() => data.find((d) => d.id === versionsId) ?? null, [data, versionsId]);

  const filterCount = (filters.confidentiality !== 'all' ? 1 : 0) + (filters.expiry !== 'any' ? 1 : 0);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const openUpload = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const onEdit = useCallback((d: SchoolDocument) => { setEditing(d); setFormOpen(true); }, []);
  const onVersions = useCallback((d: SchoolDocument) => setVersionsId(d.id), []);
  const onDownload = useCallback((d: SchoolDocument) => {
    Alert.alert('Download', `Downloading "${d.fileName}" (${d.fileType} · ${d.sizeLabel}) is coming soon.`);
  }, []);
  const onDownloadVersion = useCallback((d: SchoolDocument, v: DocumentVersion) => {
    Alert.alert('Download', `Downloading "${v.fileName}" (v${v.version} of "${d.title}") is coming soon.`);
  }, []);
  const onRestore = useCallback((d: SchoolDocument, v: DocumentVersion) => {
    Alert.alert('Restore version', `Restore v${v.version} of "${d.title}" as the current version?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', onPress: () => restore(d.id, v.version) },
    ]);
  }, [restore]);
  const onDelete = useCallback((d: SchoolDocument) => {
    Alert.alert('Delete document', `Delete "${d.title}" and all its versions? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(d.id) },
    ]);
  }, [remove]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search title or description"
        onFilterPress={() => setFilterOpen(true)}
        filterCount={filterCount}
      />
      <CategoryChips
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onAdd={() => setCatOpen(true)}
      />
      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="School Documents"
        back
        right={
          <>
            <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.newBtn} onPress={openUpload} accessibilityLabel="Upload document">
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.newText}>Upload</Text>
            </Pressable>
          </>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <DocumentCard
              item={item}
              categoryName={categoryNames.get(item.categoryId) ?? 'Uncategorised'}
              onDownload={onDownload}
              onVersions={onVersions}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No documents found</Text>
              <Text style={styles.emptySub}>Try changing the search, category or filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoading && refreshing ? (
            <ActivityIndicator color={colors.primary} />
          ) : !isLoading && total > 0 ? (
            <Text style={styles.footer}>{total} {total === 1 ? 'document' : 'documents'}</Text>
          ) : null
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

      <FilterSheet visible={filterOpen} value={filters} onApply={setFilters} onClose={() => setFilterOpen(false)} />
      <VersionsSheet
        document={versionsDoc}
        onRestore={onRestore}
        onDownload={onDownloadVersion}
        onClose={() => setVersionsId(null)}
      />
      <DocumentFormModal
        visible={formOpen}
        document={editing}
        categories={realCategories}
        defaultCategoryId={categoryId}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) update(editing.id, input);
          else add(input);
          setFormOpen(false);
        }}
      />
      <AddCategoryModal
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        onSubmit={(name) => {
          if (!name.trim()) return 'Category name is required.';
          const id = addCategory(name);
          if (!id) return 'A category with this name already exists.';
          setCatOpen(false);
          return null;
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 200, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  footer: { textAlign: 'center', fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary, paddingTop: 4 },
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
