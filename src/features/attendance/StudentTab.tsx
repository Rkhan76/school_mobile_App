import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { getClassesMaster } from '../common/api';
import type { ClassWithSections } from '../common/types';
import { correctAttendance, getStudentAttendanceHistory } from './api';
import { DateBar, type DateCtl } from './DateBar';
import { TODAY_ISO } from './dateUtils';
import { confirmDiscard, useDebounced } from './guards';
import { type AttendanceStatus as RosterStatus } from './mockAttendance';
import {
  ActionButton, EmptyState, HistorySheet, ListSkeleton, OptionSheet, PickerField, countStatuses,
  type HistoryEntry,
} from './parts';
import { StudentCard } from './RosterCards';
import { SaveBar, useSaveFlow } from './SaveBar';
import { MonthlyHeat, SummaryCard } from './StudentExtras';
import { STUDENT_STATUSES, type StudentRecord } from './types';
import { useStudentRoster } from './useRoster';

type Props = { ctl: DateCtl; onDirtyChange: (d: boolean) => void };

export function StudentTab({ ctl, onDirtyChange }: Props) {
  const permissions = useSession((s) => s.permissions);
  const canCorrect = permissions.includes('attendance.record.update');

  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    getClassesMaster()
      .then((data) => {
        if (!cancelled) setClasses(data);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      })
      .finally(() => {
        if (!cancelled) setClassesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [classId, setClassId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'class' | 'section' | null>(null);
  const roster = useStudentRoster(classId, sectionId, ctl.loaded);
  const { data, isLoading, isRefreshing, dirty, isSaving, readOnly, setStatus, setRemarks, markAll, refetch } = roster;
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim().toLowerCase(), 300);
  const [history, setHistory] = useState<StudentRecord | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const onSave = useSaveFlow(roster, 'Student');

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const loadHistory = useCallback((studentId: string) => {
    setHistoryLoading(true);
    getStudentAttendanceHistory(studentId)
      .then((rows) => {
        setHistoryEntries(rows.map((r) => ({ date: r.date, status: r.status, id: r.id })));
      })
      .catch(() => setHistoryEntries([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (history) loadHistory(history.id);
    else setHistoryEntries([]);
  }, [history, loadHistory]);

  const onCorrect = useCallback(
    async (entry: HistoryEntry, update: { status: RosterStatus; reason: string }) => {
      if (!entry.id || update.status === 'LEAVE') return;
      await correctAttendance(entry.id, { status: update.status, reason: update.reason });
      if (history) loadHistory(history.id);
      if (entry.date === ctl.loaded) refetch();
    },
    [history, loadHistory, ctl.loaded, refetch],
  );

  const counts = useMemo(() => countStatuses(data), [data]);
  const visible = useMemo(
    () => data.filter((s) => !q || s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || String(s.rollNo) === q),
    [data, q],
  );
  const ready = classId !== null && sectionId !== null;
  const selectedClass = classes.find((c) => c.id === classId) ?? null;
  const className = selectedClass?.name ?? null;
  const sectionName = selectedClass?.sections.find((s) => s.id === sectionId)?.name ?? null;
  const classOptions = useMemo(() => classes.map((c) => ({ value: c.id, label: c.name })), [classes]);
  const sectionOptions = useMemo(
    () => (selectedClass?.sections ?? []).map((s) => ({ value: s.id, label: s.name })),
    [selectedClass],
  );

  const onRefresh = useCallback(() => confirmDiscard(dirty, refetch), [dirty, refetch]);
  const renderItem = useCallback(
    ({ item }: { item: StudentRecord }) => (
      <StudentCard item={item} onStatus={setStatus} onRemarks={setRemarks} onHistory={setHistory} disabled={readOnly} />
    ),
    [setStatus, setRemarks, readOnly],
  );

  const header = (
    <View style={styles.header}>
      <Card style={{ gap: 14 }}>
        <View style={styles.pickers}>
          <PickerField label="CLASS" value={className} placeholder="Select class" disabled={classesLoading} onPress={() => setSheet('class')} />
          <PickerField
            label="SECTION"
            value={sectionName}
            placeholder="Select section"
            disabled={!selectedClass}
            onPress={() => setSheet('section')}
          />
        </View>
        <DateBar
          ctl={ctl}
          actions={
            <>
              <ActionButton label="Refresh" icon="refresh" onPress={onRefresh} disabled={!ready} />
            </>
          }
        />
        {!readOnly ? (
          <View style={styles.bulk}>
            <ActionButton label="Mark All Present" icon="checkmark-done" onPress={() => markAll('PRESENT')} disabled={!ready || isLoading || data.length === 0} />
            <ActionButton label="Mark All Absent" icon="close-circle-outline" tone="danger" onPress={() => markAll('ABSENT')} disabled={!ready || isLoading || data.length === 0} />
          </View>
        ) : null}
      </Card>
      {ready && !isLoading && data.length > 0 ? (
        <>
          <SummaryCard counts={counts} total={data.length} />
          {classId && sectionId ? <MonthlyHeat classId={classId} sectionId={sectionId} date={ctl.loaded} /> : null}
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
        options={classOptions}
        value={classId}
        onClose={() => setSheet(null)}
        onSelect={(v) => {
          setSheet(null);
          if (v !== classId) confirmDiscard(dirty, () => {
            setClassId(v);
            setSectionId(null);
          });
        }}
      />
      <OptionSheet
        visible={sheet === 'section'}
        title="Select section"
        options={sectionOptions}
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
        entries={historyEntries}
        loading={historyLoading}
        correctableDate={canCorrect ? TODAY_ISO : null}
        onCorrect={canCorrect ? onCorrect : undefined}
        onClose={() => setHistory(null)}
      />
      {!readOnly ? (
        <SaveBar order={STUDENT_STATUSES} counts={counts} dirty={dirty} saving={isSaving} disabled={!ready || isLoading} onSave={onSave} />
      ) : null}
    </View>
  );
}

function Gap() {
  return <View style={{ height: 10 }} />;
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 190, paddingTop: 4 },
  header: { gap: 12, marginBottom: 12 },
  pickers: { flexDirection: 'row', gap: 10 },
  bulk: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
}));
