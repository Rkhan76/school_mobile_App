import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { ChapterEditorModal } from './ChapterEditorModal';
import { SubjectAccordion } from './SubjectAccordion';
import { useSyllabus, type Chapter, type SubjectSyllabus } from './mockSyllabus';

type Props = { classId: string; sectionId: string; caption: string };

export function SyllabusTab({ classId, sectionId, caption }: Props) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, updateChapters, doneIds, toggleChapter, copyToOtherSections } =
    useSyllabus(classId, sectionId);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<SubjectSyllabus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

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

  const onCopy = useCallback(() => {
    Alert.alert(
      'Copy to other sections',
      `Copy this syllabus plan to all other sections of the class? Their existing plans will be replaced.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            const targets = copyToOtherSections();
            Alert.alert('Copied', `Syllabus copied to section ${targets.join(', ')}.`);
          },
        },
      ],
    );
  }, [copyToOtherSections]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.header}>
      <Text style={styles.caption}>{caption}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.copyBtn} onPress={onCopy} accessibilityLabel="Copy to other sections">
          <Ionicons name="copy-outline" size={15} color={colors.primaryDeep} />
          <Text style={styles.copyText}>Copy to other sections</Text>
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
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
        data={showSkeleton ? [] : data}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <SubjectAccordion
              item={item}
              expanded={expanded.has(item.id)}
              doneIds={doneIds}
              onToggleExpand={onToggleExpand}
              onToggleChapter={toggleChapter}
              onEdit={setEditing}
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
        title={editing ? `${editing.name} plan` : ''}
        subtitle={caption}
        chapters={editing?.chapters ?? []}
        onClose={() => setEditing(null)}
        onSave={(chapters: Chapter[]) => {
          if (editing) updateChapters(editing.id, chapters);
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
  copyBtn: {
    flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.mint,
  },
  copyText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 10 },
  skeleton: { height: 58, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
});
