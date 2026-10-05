import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { ApiError } from '../../lib/apiClient';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { AUDIENCES, type Audience, type Notice } from './types';
import { NoticeCard } from './NoticeCard';
import { NoticeDetailSheet } from './NoticeDetailSheet';
import { NoticeFormModal } from './NoticeFormModal';
import { downloadAndShareNoticePdf } from './pdf';
import { PAGE_SIZE, useNotices } from './useNotices';

const FILTERS: { value: Audience | ''; label: string }[] = [
  { value: '', label: 'All audiences' },
  ...AUDIENCES.map((a) => ({ value: a, label: a })),
];

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export function NoticesScreen() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canCreate = permissions.includes('notice.record.create');
  const canUpdate = permissions.includes('notice.record.update');
  const canDelete = permissions.includes('notice.record.delete');
  const canDownloadPdf = permissions.includes('notice.pdf.read');

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [audience, setAudience] = useState<Audience | ''>('');
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [viewing, setViewing] = useState<Notice | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, add, update, remove } = useNotices({
    search: debounced, audience, pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const openAdd = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const onEdit = useCallback((n: Notice) => { setEditing(n); setFormOpen(true); }, []);
  const onView = useCallback((n: Notice) => setViewing(n), []);
  const onSharePdf = useCallback(async (n: Notice) => {
    try {
      await downloadAndShareNoticePdf(n.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not download the notice PDF.';
      Alert.alert('Download failed', message);
    }
  }, []);
  const onDelete = useCallback((n: Notice) => {
    Alert.alert('Delete notice', `Delete "${n.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(n.id) },
    ]);
  }, [remove]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search notices..." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => {
          const on = f.value === audience;
          return (
            <Pressable
              key={f.label}
              onPress={() => setAudience(f.value)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Notice Board"
        subtitle="Announcements for your school"
        back
        right={
          <>
            <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
            {canCreate && (
              <Pressable style={styles.newBtn} onPress={openAdd} accessibilityLabel="Add notice">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newText}>Add</Text>
              </Pressable>
            )}
          </>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <NoticeCard
              item={item}
              onView={onView}
              onSharePdf={onSharePdf}
              onEdit={onEdit}
              onDelete={onDelete}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canDownloadPdf={canDownloadPdf}
            />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No notices found</Text>
              <Text style={styles.emptySub}>Try changing the search or audience filter.</Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
          ) : !showSkeleton && data.length > 0 && !hasMore ? (
            <Text style={styles.endText}>You've reached the end</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />

      <NoticeDetailSheet notice={viewing} onClose={() => setViewing(null)} canDownloadPdf={canDownloadPdf} />
      <NoticeFormModal
        visible={formOpen}
        notice={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) update(editing.id, input);
          else add(input);
          setFormOpen(false);
        }}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    height: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 170, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
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
  footerLoader: { marginVertical: 20 },
  endText: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.textHint, marginVertical: 16 },
}));
