import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors } from '../../theme/tokens';
import { DateBar, type DateCtl } from './DateBar';
import { confirmDiscard, useDebounced } from './guards';
import { buildHistory, CLASSES, SECTIONS, STUDENT_STATUSES, type StudentRecord } from './mockAttendance';
import {
  ActionButton, EmptyState, HistorySheet, ListSkeleton, OptionSheet, PickerField, countStatuses,
} from './parts';
import { StudentCard } from './RosterCards';
import { SaveBar, useSaveFlow } from './SaveBar';
import { MonthlyHeat, SummaryCard } from './StudentExtras';
import { useStudentRoster } from './useRoster';

type Props = { ctl: DateCtl; onDirtyChange: (d: boolean) => void };

const CLASS_OPTIONS = CLASSES.map((c) => ({ value: c.id, label: c.name }));
const SECTION_OPTIONS = SECTIONS.map((s) => ({ value: s.id, label: s.name }));

export function StudentTab({ ctl, onDirtyChange }: Props) {
  const [classId, setClassId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'class' | 'section' | null>(null);
  const roster = useStudentRoster(classId, sectionId, ctl.loaded);
  const { data, isLoading, isRefreshing, dirty, isSaving, setStatus, setRemarks, markAll, refetch } = roster;
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim().toLowerCase(), 300);
  const [history, setHistory] = useState<StudentRecord | null>(null);
  const onSave = useSaveFlow(roster, 'Student');

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const counts = useMemo(() => countStatuses(data), [data]);
  const visible = useMemo(
    () => data.filter((s) => !q || s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || String(s.rollNo) === q),
    [data, q],
  );
  const ready = classId !== null && sectionId !== null;
  const className = CLASSES.find((c) => c.id === classId)?.name ?? null;
  const sectionName = SECTIONS.find((s) => s.id === sectionId)?.name ?? null;

  const onRefresh = useCallback(() => confirmDiscard(dirty, refetch), [dirty, refetch]);
  const renderItem = useCallback(
    ({ item }: { item: StudentRecord }) => (
      <StudentCard item={item} onStatus={setStatus} onRemarks={setRemarks} onHistory={setHistory} />
    ),
    [setStatus, setRemarks],
  );

  const header = (
    <View style={styles.header}>
      <Card style={{ gap: 14 }}>
        <View style={styles.pickers}>
          <PickerField label="CLASS" value={className} placeholder="Select class" onPress={() => setSheet('class')} />
          <PickerField label="SECTION" value={sectionName} placeholder="Select section" onPress={() => setSheet('section')} />
        </View>
        <DateBar
          ctl={ctl}
          actions={
            <>
              <ActionButton label="Refresh" icon="refresh" onPress={onRefresh} disabled={!ready} />
            </>
          }
        />
        <View style={styles.bulk}>
          <ActionButton label="Mark All Present" icon="checkmark-done" onPress={() => markAll('PRESENT')} disabled={!ready || isLoading || data.length === 0} />
          <ActionButton label="Mark All Absent" icon="close-circle-outline" tone="danger" onPress={() => markAll('ABSENT')} disabled={!ready || isLoading || data.length === 0} />
        </View>
      </Card>
      {ready && !isLoading && data.length > 0 ? (
        <>
          <SummaryCard counts={counts} total={data.length} />
          <MonthlyHeat classId={classId} sectionId={sectionId} date={ctl.loaded} />
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search students..." />
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={isLoading || !ready ? [] : visible}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          !ready ? (
            <EmptyState icon="school-outline" title="Select a class" hint="Choose a class and section to load the student roster." />
          ) : isLoading ? (
            <ListSkeleton />
          ) : (
            <EmptyState icon="people-outline" title="No students found" hint="Try a different search term." />
          )
        }
        ItemSeparatorComponent={Gap}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        initialNumToRender={8}
      />
      <OptionSheet
        visible={sheet === 'class'}
        title="Select class"
        options={CLASS_OPTIONS}
        value={classId}
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          setSheet(null);
          if (v !== classId) confirmDiscard(dirty, () => setClassId(v));
        }}
      />
      <OptionSheet
        visible={sheet === 'section'}
        title="Select section"
        options={SECTION_OPTIONS}
        value={sectionId}
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          setSheet(null);
          if (v !== sectionId) confirmDiscard(dirty, () => setSectionId(v));
        }}
      />
      <HistorySheet
        visible={history !== null}
        title={history?.name ?? ''}
        subtitle={history ? `Roll ${history.rollNo} · ${history.admissionNo}` : ''}
        entries={history ? buildHistory(history.id, ctl.loaded, true) : []}
        onClose={() => setHistory(null)}
      />
      <SaveBar order={STUDENT_STATUSES} counts={counts} dirty={dirty} saving={isSaving} disabled={!ready || isLoading} onSave={onSave} />
    </View>
  );
}

function Gap() {
  return <View style={{ height: 10 }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 190, paddingTop: 4 },
  header: { gap: 12, marginBottom: 12 },
  pickers: { flexDirection: 'row', gap: 10 },
  bulk: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
