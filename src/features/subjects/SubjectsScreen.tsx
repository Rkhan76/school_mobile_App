import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { ApiError } from '../../lib/apiClient';
import { useSession } from '../auth/session';
import { ManageSheet } from './ManageSheet';
import { OptionSheet, type Option } from './OptionSheet';
import { PickerField } from './PickerField';
import { SubjectCard } from './SubjectCard';
import { SubjectFormModal } from './SubjectFormModal';
import { useSubjects } from './useSubjects';
import type { SubjectWithAssignments } from './types';

type SheetKind = 'class' | 'section' | 'year' | null;

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const { permissions } = useSession();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [yearId, setYearId] = useState('');
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectWithAssignments | null>(null);
  const [managing, setManaging] = useState<SubjectWithAssignments | null>(null);

  const canCreate = permissions.includes('subject.record.create');
  const canUpdate = permissions.includes('subject.record.update');
  const canDeletePerm = permissions.includes('subject.record.delete');
  const canManagePerm = permissions.includes('subject.section-link.update');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data, total, stats, allCodes, classes, years, activeYearId, isLoading, error, refetch, add, update, remove, setAssignments,
  } = useSubjects({ search: debounced, classId, sectionId, yearId });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  useEffect(() => {
    if (error) Alert.alert('Something went wrong', error);
  }, [error]);

  const classOptions = useMemo<Option[]>(() => classes.map((c) => ({ value: c.id, label: c.name })), [classes]);
  const sectionOptions = useMemo<Option[]>(
    () => (classId ? (classes.find((c) => c.id === classId)?.sections ?? []).map((s) => ({ value: s.id, label: `Section ${s.name}` })) : []),
    [classes, classId],
  );
  const yearOptions = useMemo<Option[]>(() => years.map((y) => ({ value: y.id, label: y.label })), [years]);

  const className = classes.find((c) => c.id === classId)?.name ?? null;
  const sectionName = sectionOptions.find((s) => s.value === sectionId)?.label ?? null;
  const yearLabel = years.find((y) => y.id === yearId)?.label ?? null;
  const activeYearLabel = years.find((y) => y.id === activeYearId)?.label;

  const takenCodes = useMemo(
    () => allCodes.filter((c) => c.id !== editing?.id).map((c) => c.code),
    [allCodes, editing],
  );

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const openAdd = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const onEdit = useCallback((s: SubjectWithAssignments) => { setEditing(s); setFormOpen(true); }, []);
  const onManage = useCallback((s: SubjectWithAssignments) => setManaging(s), []);
  const onView = useCallback((s: SubjectWithAssignments) => {
    const assigned = s.assignments.length
      ? s.assignments.map((a) => `${a.section.class.name} · ${a.section.name}`).join(', ')
      : 'Not assigned';
    Alert.alert(
      `${s.name} (${s.subjectCode})`,
      `${s.description || 'No description'}\n\nAssigned to (${s.assignments.length}): ${assigned}`,
    );
  }, []);
  const onDelete = useCallback((s: SubjectWithAssignments) => {
    Alert.alert(
      'Delete subject',
      `Delete "${s.name}"? This permanently removes it from the catalog — there is NO safety check: it will be deleted even if it's currently assigned to sections or referenced by exams, homework or syllabus. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove(s.id).catch((err) => {
              Alert.alert('Delete failed', err instanceof ApiError ? err.message : 'Please try again.');
            });
          },
        },
      ],
    );
  }, [remove]);

  const onSaveAssignments = useCallback((id: string, sectionIds: string[]) => {
    setAssignments(id, sectionIds).catch((err) => {
      Alert.alert('Save failed', err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Please try again.');
    });
  }, [setAssignments]);

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
        <PickerField label="ACADEMIC YEAR" value={yearLabel} placeholder="Select year..." onPress={() => setSheet('year')} />
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
            {canCreate ? (
              <Pressable style={styles.newBtn} onPress={openAdd} accessibilityLabel="Add subject">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newText}>Add</Text>
              </Pressable>
            ) : null}
          </>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <SubjectCard
              item={item}
              canManage={canManagePerm}
              canEdit={canUpdate}
              canDelete={canDeletePerm}
              onView={onView}
              onManage={onManage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
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
        onSelect={(v) => { setClassId(v); setSectionId(''); setSheet(null); }}
      />
      <OptionSheet
        visible={sheet === 'section'}
        title="Select section"
        allLabel="All sections"
        options={sectionOptions}
        value={sectionId}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setSectionId(v); setSheet(null); }}
      />
      <OptionSheet
        visible={sheet === 'year'}
        title="Select academic year"
        allLabel="All years"
        options={yearOptions}
        value={yearId}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setYearId(v); setSheet(null); }}
      />
      <ManageSheet
        subject={managing}
        classes={classes}
        activeYearId={activeYearId}
        activeYearLabel={activeYearLabel}
        onClose={() => setManaging(null)}
        onSave={onSaveAssignments}
      />
      <SubjectFormModal
        visible={formOpen}
        subject={editing}
        takenCodes={takenCodes}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          const task = editing ? update(editing.id, input) : add(input);
          task
            .then(() => setFormOpen(false))
            .catch((err) => {
              Alert.alert('Save failed', err instanceof ApiError ? err.message : 'Please try again.');
            });
        }}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
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
}));
