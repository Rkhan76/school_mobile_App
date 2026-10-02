import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import type { SectionLite } from '../common/types';
import { ChapterEditorModal } from './ChapterEditorModal';
import { CopySectionsSheet } from './CopySectionsSheet';
import { SubjectAccordion } from './SubjectAccordion';
import { useChapterReviewed, useSyllabus } from './useSyllabus';
import type { ChapterInput, SubjectEntry } from './types';

type Props = {
  sectionId: string;
  academicYearId: string;
  otherSections: SectionLite[];
  caption: string;
  canEdit: boolean;
};

export function SyllabusTab({ sectionId, academicYearId, otherSections, caption, canEdit }: Props) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch, updateChapters, copyToOtherSections } = useSyllabus(sectionId, academicYearId);
  const { reviewedIds, toggleReviewed } = useChapterReviewed();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<SubjectEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const subjects = data?.subjects ?? [];

  const onToggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const onCopyConfirm = useCallback(
    async (targetIds: string[], overwrite: boolean) => {
      setCopyOpen(false);
      try {
        const result = await copyToOtherSections(targetIds, { overwrite });
        const copiedCount = result.copied.length;
        const skippedCount = result.skipped.length;
        Alert.alert(
          'Copy complete',
          skippedCount > 0
            ? `${copiedCount} plan(s) copied, ${skippedCount} skipped (already had a plan).`
            : `${copiedCount} plan(s) copied.`,
        );
      } catch {
        Alert.alert('Copy failed', 'Could not copy the syllabus plan. Please try again.');
      }
    },
    [copyToOtherSections],
  );

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.header}>
      <Text style={styles.caption}>{caption}</Text>
      <View style={styles.actions}>
        {canEdit ? (
          <Pressable style={styles.copyBtn} onPress={() => setCopyOpen(true)} accessibilityLabel="Copy to other sections">
            <Ionicons name="copy-outline" size={15} color={colors.primaryDeep} />
            <Text style={styles.copyText}>Copy to other sections</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3, 4, 5].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={showSkeleton ? [] : subjects}
        keyExtractor={(s) => s.subject.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <SubjectAccordion
              item={item}
              expanded={expanded.has(item.subject.id)}
              reviewedIds={reviewedIds}
              onToggleExpand={onToggleExpand}
              onToggleChapter={toggleReviewed}
              onEdit={canEdit ? setEditing : undefined}
            />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No syllabus found</Text>
              <Text style={styles.emptySub}>No subjects are planned for this section.</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 10 }}
        initialNumToRender={8}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
      <ChapterEditorModal
        visible={editing !== null}
        title={editing ? `${editing.subject.name} plan` : ''}
        subtitle={caption}
        chapters={editing?.chapters ?? []}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={async (chapters: ChapterInput[]) => {
          if (!editing) return;
          setSaving(true);
          try {
            await updateChapters(editing.subject.id, chapters);
            setEditing(null);
          } catch {
            Alert.alert('Save failed', 'Could not save the chapter plan. Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />
      <CopySectionsSheet
        visible={copyOpen}
        sections={otherSections}
        onClose={() => setCopyOpen(false)}
        onConfirm={onCopyConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, gap: 10, paddingBottom: 2 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  copyBtn: {
    flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.mint,
  },
  copyText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 10 },
  skeleton: { height: 58, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
});
