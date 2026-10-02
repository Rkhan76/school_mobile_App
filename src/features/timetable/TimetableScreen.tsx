import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../lib/apiClient';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius } from '../../theme/tokens';
import { PickerField } from '../subjects/PickerField';
import { SelectSheet } from '../syllabus/SelectSheet';
import { lookupSubjects, lookupTeachers } from './api';
import { BreakRow } from './BreakRow';
import { DaySelector } from './DaySelector';
import { PeriodCard } from './PeriodCard';
import { SlotEditSheet, type SlotFormInput } from './SlotEditSheet';
import { TimetableSkeleton } from './TimetableSkeleton';
import {
  useActiveAcademicYearId, useClassesMaster, usePeriods, useSectionGrid, useMySchedule,
  useSlotMutations, useTimetablePermissions,
} from './useTimetable';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { WeekOverview } from './WeekOverview';
import {
  DAY_LONG, DAY_TO_DOW, isCurrentPeriod, nowInfo,
  type Day, type Option, type Period, type TimetableSlot,
} from './types';

type SheetKind = 'class' | 'section' | null;

export function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const perms = useTimetablePermissions();

  const [mode, setMode] = useState<ViewMode>('class');
  const [classId, setClassId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [day, setDay] = useState<Day>(() => nowInfo().day ?? 'MON');
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [showWeek, setShowWeek] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [now, setNow] = useState(() => nowInfo());
  useEffect(() => {
    const t = setInterval(() => setNow(nowInfo()), 60000);
    return () => clearInterval(t);
  }, []);

  const { classes, isLoading: classesLoading } = useClassesMaster();
  const academicYearId = useActiveAcademicYearId();

  // Default to the first class/section once the master list loads.
  useEffect(() => {
    if (classes.length === 0) return;
    if (classId && classes.some((c) => c.id === classId)) return;
    const first = classes[0];
    setClassId(first?.id ?? null);
    setSectionId(first?.sections[0]?.id ?? null);
  }, [classes, classId]);

  const selectedClass = classes.find((c) => c.id === classId);
  const sections = selectedClass?.sections ?? [];

  useEffect(() => {
    if (!selectedClass) return;
    if (sectionId && sections.some((s) => s.id === sectionId)) return;
    setSectionId(sections[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const { periods, isLoading: periodsLoading } = usePeriods(perms.canListPeriods);

  const classGridEnabled = mode === 'class' && perms.canView;
  const cls = useSectionGrid(sectionId, academicYearId, classGridEnabled);

  const mineEnabled = mode === 'teacher' && perms.canViewMine;
  const mine = useMySchedule(academicYearId, mineEnabled);

  const refetchClass = cls.refetch;
  const onSlotsChanged = useCallback(() => { void refetchClass(); }, [refetchClass]);
  const { save, remove, isSaving } = useSlotMutations(sectionId, academicYearId, onSlotsChanged);

  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<Option[]>([]);
  useEffect(() => {
    lookupSubjects()
      .then((rows) => setSubjectOptions(rows.map((s) => ({ value: s.id, label: s.name }))))
      .catch(() => setSubjectOptions([]));
    lookupTeachers()
      .then((rows) => setTeacherOptions(rows.map((t) => ({ value: t.id, label: t.fullName }))))
      .catch(() => setTeacherOptions([]));
  }, []);

  const isLoading = mode === 'class'
    ? (classesLoading || periodsLoading || cls.isLoading)
    : (periodsLoading || mine.isLoading);
  const loadError = mode === 'class' ? cls.error : mine.error;
  const isToday = day === now.day;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await (mode === 'class' ? cls.refetch() : mine.refetch());
    setRefreshing(false);
  }, [mode, cls, mine]);

  const className = selectedClass?.name ?? '';
  const sectionName = sections.find((s) => s.id === sectionId)?.name ?? '';
  const subtitle = mode === 'class' ? [className, sectionName].filter(Boolean).join(' - ') : 'My schedule';

  const dow = DAY_TO_DOW[day];
  const daySlots: TimetableSlot[] = mode === 'class'
    ? cls.slots.filter((s) => s.dayOfWeek === dow)
    : mine.slots.filter((s) => s.dayOfWeek === dow);
  const isEmpty = daySlots.length === 0;

  const editingSlot = editing ? daySlots.find((s) => s.period.id === editing.id) : undefined;

  const canOpenCell = (slot: TimetableSlot | undefined) =>
    mode === 'class' && (slot ? perms.canUpdate : perms.canCreate);

  const closeSheet = () => { setEditing(null); setSaveError(null); };

  const handleSave = async (input: SlotFormInput) => {
    if (!editing) return;
    setSaveError(null);
    try {
      await save(editingSlot?.id ?? null, {
        dayOfWeek: dow,
        periodId: editing.id,
        subjectId: input.subjectId,
        teacherId: input.teacherId,
        roomName: input.room,
      });
      closeSheet();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save this slot.');
    }
  };

  const handleClear = async () => {
    if (!editingSlot) return;
    setSaveError(null);
    try {
      await remove(editingSlot.id);
      closeSheet();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not delete this slot.');
    }
  };

  const renderRows = () =>
    periods.map((p) => {
      const isNow = isToday && isCurrentPeriod(p, now.minutes);
      if (p.isBreak) return <BreakRow key={p.id} period={p} isNow={isNow} />;
      const slot = daySlots.find((s) => s.period.id === p.id);
      const openable = canOpenCell(slot);
      if (mode === 'class') {
        return (
          <PeriodCard
            key={p.id}
            period={p}
            subject={slot?.subject?.name}
            secondary={slot?.teacher?.fullName}
            room={slot?.roomName ?? undefined}
            isNow={isNow}
            onPress={openable ? () => setEditing(p) : undefined}
          />
        );
      }
      const label = [slot?.class?.name, slot?.section?.name].filter(Boolean).join(' - ');
      return (
        <PeriodCard
          key={p.id}
          period={p}
          subject={slot?.subject?.name}
          secondary={label || undefined}
          room={slot?.roomName ?? undefined}
          isNow={isNow}
          showAvatar={false}
        />
      );
    });

  const noPermission = mode === 'class' ? !perms.canView : !perms.canViewMine;

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Timetable"
        subtitle={subtitle}
        back
        right={
          <Pressable
            style={styles.iconBtn}
            onPress={() => Alert.alert('Print Timetable', 'Printing is coming soon.')}
            accessibilityLabel="Print timetable"
          >
            <Ionicons name="print-outline" size={20} color={colors.text} />
          </Pressable>
        }
      />

      <View style={styles.top}>
        <View style={styles.pad}><ViewToggle value={mode} onChange={setMode} /></View>
        {mode === 'class' ? (
          <View style={[styles.pickers, styles.pad]}>
            <PickerField label="CLASS" value={className || null} placeholder="Class" onPress={() => setSheet('class')} />
            <PickerField
              label="SECTION"
              value={sectionName ? `Section ${sectionName}` : null}
              placeholder="Section"
              onPress={() => setSheet('section')}
            />
          </View>
        ) : null}
        <DaySelector value={day} onChange={setDay} today={now.day} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.dayRow}>
          <Text style={styles.dayTitle}>{DAY_LONG[day]}</Text>
          {isToday ? <Text style={styles.today}>Today</Text> : null}
        </View>

        {mode === 'class' ? (
          <>
            <Pressable
              style={styles.weekToggle}
              onPress={() => setShowWeek((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showWeek }}
            >
              <Ionicons name="grid-outline" size={16} color={colors.primaryDeep} />
              <Text style={styles.weekText}>Week overview</Text>
              <Ionicons name={showWeek ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryDeep} />
            </Pressable>
            {showWeek && !isLoading ? <WeekOverview periods={periods} slots={cls.slots} today={now.day} /> : null}
          </>
        ) : null}

        {noPermission ? (
          <View style={styles.empty}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.textHint} />
            <Text style={styles.emptyTitle}>No access</Text>
            <Text style={styles.emptyText}>
              {mode === 'class' ? "You don't have permission to view the timetable." : "You don't have permission to view your schedule."}
            </Text>
          </View>
        ) : loadError ? (
          <View style={styles.empty}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
            <Text style={styles.emptyTitle}>Couldn't load timetable</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : isLoading && !refreshing ? (
          <TimetableSkeleton />
        ) : isEmpty ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-clear-outline" size={40} color={colors.textHint} />
            <Text style={styles.emptyTitle}>No periods scheduled</Text>
            <Text style={styles.emptyText}>
              {mode === 'class' ? `Tap a period to add a subject for ${DAY_LONG[day]}.` : `No classes on ${DAY_LONG[day]}.`}
            </Text>
            {mode === 'class' ? (
              <View style={styles.emptyList}>{renderRows()}</View>
            ) : null}
          </View>
        ) : (
          renderRows()
        )}
      </ScrollView>

      <SelectSheet
        visible={sheet === 'class'}
        title="Select class"
        options={classes.map((c) => ({ value: c.id, label: c.name }))}
        value={classId ?? ''}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setClassId(v); setSectionId(null); setSheet(null); }}
      />
      <SelectSheet
        visible={sheet === 'section'}
        title="Select section"
        options={sections.map((s) => ({ value: s.id, label: s.name }))}
        value={sectionId ?? ''}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setSectionId(v); setSheet(null); }}
      />
      <SlotEditSheet
        visible={editing !== null}
        day={day}
        period={editing}
        slot={editingSlot}
        subjectOptions={subjectOptions}
        teacherOptions={teacherOptions}
        canDelete={perms.canDelete}
        isSaving={isSaving}
        error={saveError}
        onSave={handleSave}
        onClear={handleClear}
        onClose={closeSheet}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  top: { gap: 12, paddingBottom: 12 },
  pad: { paddingHorizontal: 16 },
  pickers: { flexDirection: 'row', gap: 8 },
  list: { paddingHorizontal: 16, gap: 10 },
  dayRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  dayTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  today: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primaryDeep },
  weekToggle: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    borderRadius: radius.pill, backgroundColor: colors.mint,
  },
  weekText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, marginTop: 4 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  emptyList: { alignSelf: 'stretch', gap: 10 },
});
