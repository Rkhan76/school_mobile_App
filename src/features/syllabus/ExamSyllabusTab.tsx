import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { ChapterEditorModal } from './ChapterEditorModal';
import { ExamCard } from './ExamCard';
import { ExamFilterSheet, type ExamExtraFilters } from './ExamFilterSheet';
import { useExamSyllabus, type Chapter, type ExamSyllabus } from './mockSyllabus';

const PAGE_SIZE = 8;

type Props = { classId: string; sectionId: string; year: string; caption: string };

export function ExamSyllabusTab({ classId, sectionId, year, caption }: Props) {
  const insets = useSafeAreaInsets();
  const [extra, setExtra] = useState<ExamExtraFilters>({ examType: '', subjectId: '', upcomingOnly: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const [editing, setEditing] = useState<ExamSyllabus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, refetch, updateExam } = useExamSyllabus({ classId, sectionId, year, ...extra });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [classId, sectionId, year, extra]);

  const visible = useMemo(() => data.slice(0, visibleCount), [data, visibleCount]);
  const hasMore = visibleCount < data.length;
  const activeFilters = (extra.examType ? 1 : 0) + (extra.subjectId ? 1 : 0) + (extra.upcomingOnly ? 1 : 0);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasMore) setVisibleCount((n) => n + PAGE_SIZE);
  }, [hasMore]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.header}>
      <Text style={styles.caption}>{caption}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)} accessibilityLabel="Filter exams">
          <Ionicons name="options-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.filterText}>Filters</Text>
          {activeFilters > 0 ? (
            <View style={styles.dot}><Text style={styles.dotText}>{activeFilters}</Text></View>
          ) : null}
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
      {!showSkeleton ? (
        <Text style={styles.count}>{data.length} exam{data.length === 1 ? '' : 's'}</Text>
      ) : (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      )}
    </View>
  );

  return (
    <>
      <FlatList
        data={showSkeleton ? [] : visible}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <ExamCard item={item} onEdit={setEditing} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No exams found</Text>
              <Text style={styles.emptySub}>Try changing the filters.</Text>
            </View>
          )
        }
        ListFooterComponent={hasMore && !showSkeleton ? <ActivityIndicator color={colors.primary} /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
      />
      <ExamFilterSheet
        visible={filterOpen}
        value={extra}
        onClose={() => setFilterOpen(false)}
        onApply={(v) => { setExtra(v); setFilterOpen(false); }}
      />
      <ChapterEditorModal
        visible={editing !== null}
        title="Edit syllabus"
        subtitle={editing?.title}
        chapters={editing?.chapters ?? []}
        onClose={() => setEditing(null)}
        onSave={(chapters: Chapter[]) => {
          if (editing) updateExam(editing.id, chapters);
          setEditing(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, gap: 10, paddingBottom: 2 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterBtn: {
    flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.mint,
  },
  filterText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  dot: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  dotText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.white },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  count: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary, textAlign: 'right' },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 220, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
});
