import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { ManageSheet } from './ManageSheet';
import { OptionSheet, type Option } from './OptionSheet';
import { Pagination } from './Pagination';
import { PickerField } from './PickerField';
import { SubjectCard } from './SubjectCard';
import { SubjectFormModal } from './SubjectFormModal';
import {
  ACADEMIC_YEARS, CLASS_LIST, sectionsOfClass, useSubjects, type Subject,
} from './mockSubjects';

const PAGE_SIZE = 10;
type SheetKind = 'class' | 'section' | 'year' | null;

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [managing, setManaging] = useState<Subject | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, total, stats, allCodes, isLoading, refetch, add, update, remove, setAssignments } = useSubjects({
    search: debounced, classId, sectionId, year, page, pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const classOptions = useMemo<Option[]>(() => CLASS_LIST.map((c) => ({ value: c.id, label: c.name })), []);
  const sectionOptions = useMemo<Option[]>(
    () => (classId ? sectionsOfClass(classId).map((s) => ({ value: s.sectionId, label: `Section ${s.sectionName}` })) : []),
    [classId],
  );
  const yearOptions = useMemo<Option[]>(() => ACADEMIC_YEARS.map((y) => ({ value: y, label: y })), []);

  const className = CLASS_LIST.find((c) => c.id === classId)?.name ?? null;
  const sectionName = sectionOptions.find((s) => s.value === sectionId)?.label ?? null;

  const takenCodes = useMemo(
    () => allCodes.filter((c) => c.id !== editing?.id).map((c) => c.code),
    [allCodes, editing],
  );

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const openAdd = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const onEdit = useCallback((s: Subject) => { setEditing(s); setFormOpen(true); }, []);
  const onManage = useCallback((s: Subject) => setManaging(s), []);
  const onView = useCallback((s: Subject) => {
    const assigned = s.assignments.length ? s.assignments.map((a) => a.label).join(', ') : 'Not assigned';
    Alert.alert(
      `${s.name} (${s.subjectCode})`,
      `${s.description || 'No description'}\n\nAssigned to (${s.assignments.length}): ${assigned}`,
    );
  }, []);
  const onDelete = useCallback((s: Subject) => {
    Alert.alert('Delete subject', `Delete ${s.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(s.id) },
    ]);
  }, [remove]);

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.row}>
        <StatTile label="Total Subjects" value={String(stats.total)} icon="book-outline" tint={colors.blue} />
        <StatTile label="Subject Codes" value={String(stats.codes)} icon="pricetag-outline" tint={colors.orange} />
      </View>
      <View style={styles.row}>
        <StatTile label="With Description" value={String(stats.withDescription)} icon="document-text-outline" tint={colors.success} />
        <StatTile label="No Description" value={String(stats.noDescription)} icon="alert-circle-outline" tint={colors.purple} />
      </View>
      <View style={styles.row}>
        <PickerField label="CLASS" value={className} placeholder="Select class..." onPress={() => setSheet('class')} />
        <PickerField
          label="SECTION"
          value={sectionName}
          placeholder={classId ? 'Select section...' : 'Select class first'}
          disabled={!classId}
          onPress={() => setSheet('section')}
        />
      </View>
      <View style={styles.row}>
        <PickerField label="ACADEMIC YEAR" value={year || null} placeholder="Select year..." onPress={() => setSheet('year')} />
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, code, description..." />
      <Text style={styles.count}>{total} subject{total === 1 ? '' : 's'}</Text>
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
        title="Subjects"
        subtitle={`${stats.total} subjects`}
        back
        right={
          <>
            <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.newBtn} onPress={openAdd} accessibilityLabel="Add subject">
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.newText}>Add</Text>
            </Pressable>
          </>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <SubjectCard item={item} onView={onView} onManage={onManage} onEdit={onEdit} onDelete={onDelete} />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No subjects found</Text>
              <Text style={styles.emptySub}>Try changing the search or filters.</Text>
            </View>
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

      <OptionSheet
        visible={sheet === 'class'}
        title="Select class"
        allLabel="All classes"
        options={classOptions}
        value={classId}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setClassId(v); setSectionId(''); setPage(1); setSheet(null); }}
      />
      <OptionSheet
        visible={sheet === 'section'}
        title="Select section"
        allLabel="All sections"
        options={sectionOptions}
        value={sectionId}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setSectionId(v); setPage(1); setSheet(null); }}
      />
      <OptionSheet
        visible={sheet === 'year'}
        title="Select academic year"
        allLabel="All years"
        options={yearOptions}
        value={year}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setYear(v); setPage(1); setSheet(null); }}
      />
      <ManageSheet subject={managing} onClose={() => setManaging(null)} onSave={setAssignments} />
      <SubjectFormModal
        visible={formOpen}
        subject={editing}
        takenCodes={takenCodes}
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

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  count: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary, textAlign: 'right' },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 150, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
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
});
