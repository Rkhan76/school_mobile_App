import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { getDownloadLink } from './api';
import { CategoryChips } from './CategoryChips';
import { DocumentCard } from './DocumentCard';
import { DocumentFormModal, type FormMode, type FormResult } from './DocumentFormModal';
import { DEFAULT_FILTERS, FilterSheet, type DocFilters } from './FilterSheet';
import type { DocumentVersion, SchoolDocument } from './types';
import { SCHOOL_DOC_PERMISSIONS } from './types';
import { ALL_CATEGORY_ID, schoolDocumentsErrorMessage, useSchoolDocuments } from './useSchoolDocuments';
import { VersionsSheet } from './VersionsSheet';

export function SchoolDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { permissions } = useSession();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState(ALL_CATEGORY_ID);
  const [filters, setFilters] = useState<DocFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formMode, setFormMode] = useState<FormMode>('upload');
  const [formOpen, setFormOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<SchoolDocument | null>(null);
  const [versionPrefill, setVersionPrefill] = useState<{ description?: string; expiryDate?: string | null } | null>(null);

  const [versionsDoc, setVersionsDoc] = useState<SchoolDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const canCreate = permissions.includes(SCHOOL_DOC_PERMISSIONS.create);
  const canUpdate = permissions.includes(SCHOOL_DOC_PERMISSIONS.update);
  const canDelete = permissions.includes(SCHOOL_DOC_PERMISSIONS.delete);
  const canSetClassified = permissions.includes(SCHOOL_DOC_PERMISSIONS.classifiedRead);

  const {
    data, total, categories, isLoading, planLocked, planMessage,
    refetch, add, update, addVersion, remove, getVersions,
  } = useSchoolDocuments({
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

  const filterCount = (filters.confidentiality !== 'all' ? 1 : 0) + (filters.expiry !== 'any' ? 1 : 0);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const openUpload = useCallback(() => {
    setActiveDoc(null);
    setVersionPrefill(null);
    setFormMode('upload');
    setFormOpen(true);
  }, []);

  const onEdit = useCallback((d: SchoolDocument) => {
    setActiveDoc(d);
    setVersionPrefill(null);
    setFormMode('edit');
    setFormOpen(true);
  }, []);

  const openVersionUpload = useCallback((d: SchoolDocument, prefill: { description?: string; expiryDate?: string | null } | null) => {
    setActiveDoc(d);
    setVersionPrefill(prefill);
    setFormMode('version');
    setFormOpen(true);
  }, []);

  const onVersions = useCallback(
    (d: SchoolDocument) => {
      setVersionsDoc(d);
      setVersions([]);
      setVersionsLoading(true);
      getVersions(d.id)
        .then(setVersions)
        .finally(() => setVersionsLoading(false));
    },
    [getVersions]
  );

  const download = useCallback(async (d: SchoolDocument) => {
    try {
      const link = await getDownloadLink(d.id);
      await Linking.openURL(link.url);
    } catch (err) {
      Alert.alert('Error', schoolDocumentsErrorMessage(err));
    }
  }, []);

  const onDelete = useCallback(
    (d: SchoolDocument) => {
      Alert.alert('Delete document', `Delete "${d.title}" and all its versions? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(d.id) },
      ]);
    },
    [remove]
  );

  const handleFormSubmit = useCallback(
    async (result: FormResult) => {
      if (result.mode === 'upload') {
        await add(result.payload, result.file);
      } else if (result.mode === 'edit' && activeDoc) {
        await update(activeDoc.id, result.payload);
      } else if (result.mode === 'version' && activeDoc) {
        await addVersion(activeDoc.id, result.payload, result.file);
      }
      setFormOpen(false);
      if (versionsDoc) setVersionsDoc(null);
    },
    [activeDoc, add, update, addVersion, versionsDoc]
  );

  const showSkeleton = isLoading && !refreshing;

  if (planLocked) {
    return (
      <ScreenBackground>
        <ScreenHeader title="School Documents" back />
        <View style={styles.locked}>
          <Ionicons name="lock-closed-outline" size={44} color={colors.textHint} />
          <Text style={styles.lockedTitle}>Not available on your plan</Text>
          <Text style={styles.lockedSub}>
            {planMessage ?? "School Documents isn't included in your school's current plan. Contact your administrator to upgrade."}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  const header = (
    <View style={styles.headerWrap}>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search title or description"
        onFilterPress={() => setFilterOpen(true)}
        filterCount={filterCount}
      />
      <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
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
            {canCreate ? (
              <Pressable style={styles.newBtn} onPress={openUpload} accessibilityLabel="Upload document">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newText}>Upload</Text>
              </Pressable>
            ) : null}
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
              canEdit={canUpdate}
              canDelete={canDelete}
              onDownload={download}
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
        versions={versions}
        isLoading={versionsLoading}
        onDownloadCurrent={(d) => { setVersionsDoc(null); download(d); }}
        onUseAsNewVersion={(d, v) => {
          setVersionsDoc(null);
          openVersionUpload(d, { description: v.description ?? undefined, expiryDate: v.expiryDate ?? null });
        }}
        onClose={() => setVersionsDoc(null)}
      />
      <DocumentFormModal
        visible={formOpen}
        mode={formMode}
        document={activeDoc}
        prefill={versionPrefill}
        categories={realCategories}
        defaultCategoryId={categoryId}
        canSetClassified={canSetClassified}
        onSubmit={handleFormSubmit}
        onClose={() => setFormOpen(false)}
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
  locked: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  lockedTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  lockedSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
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
