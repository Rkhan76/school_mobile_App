import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius } from '../../theme/tokens';
import { PickerField } from '../subjects/PickerField';
import { SelectSheet } from '../syllabus/SelectSheet';
import { BreakRow } from './BreakRow';
import { DaySelector } from './DaySelector';
import { PeriodCard } from './PeriodCard';
import { SlotEditSheet } from './SlotEditSheet';
import { TimetableSkeleton } from './TimetableSkeleton';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { WeekOverview } from './WeekOverview';
import {
  CLASS_OPTIONS, DAY_LONG, DEFAULT_CLASS, DEFAULT_SECTION, MOCK_TODAY, SECTION_OPTIONS, TEACHER_OPTIONS,
  classLabel, isCurrentPeriod, useTeacherTimetable, useTimetable,
  type Day, type Period,
} from './mockTimetable';

type SheetKind = 'class' | 'section' | 'teacher' | null;

export function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ViewMode>('class');
  const [classId, setClassId] = useState(DEFAULT_CLASS);
  const [sectionId, setSectionId] = useState(DEFAULT_SECTION);
  const [teacherId, setTeacherId] = useState(TEACHER_OPTIONS[0]?.value ?? '');
  const [day, setDay] = useState<Day>(MOCK_TODAY);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [showWeek, setShowWeek] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cls = useTimetable(classId, sectionId);
  const teacher = useTeacherTimetable(teacherId);

  const isLoading = mode === 'class' ? cls.isLoading : teacher.isLoading;
  const periods = cls.periods;
  const isToday = day === MOCK_TODAY;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await (mode === 'class' ? cls.refetch() : teacher.refetch());
    setRefreshing(false);
  }, [mode, cls, teacher]);

  const className = CLASS_OPTIONS.find((c) => c.value === classId)?.label ?? '';
  const teacherName = TEACHER_OPTIONS.find((t) => t.value === teacherId)?.label ?? '';
  const subtitle = mode === 'class' ? classLabel(classId, sectionId) : teacherName;

  const daySlots = cls.slots.filter((s) => s.day === day);
  const dayEntries = teacher.entries.filter((e) => e.day === day);
  const isEmpty = mode === 'class' ? daySlots.length === 0 : dayEntries.length === 0;

  const editingSlot = editing ? cls.slots.find((s) => s.day === day && s.periodId === editing.id) : undefined;

  const renderRows = () =>
    periods.map((p) => {
      const now = isToday && isCurrentPeriod(p);
      if (p.isBreak) return <BreakRow key={p.id} period={p} isNow={now} />;
      if (mode === 'class') {
        const slot = daySlots.find((s) => s.periodId === p.id);
        return (
          <PeriodCard
            key={p.id}
            period={p}
            subject={slot?.subject}
            secondary={slot?.teacherName}
            room={slot?.room}
            isNow={now}
            onPress={() => setEditing(p)}
          />
        );
      }
      const entry = dayEntries.find((e) => e.periodId === p.id);
      return (
        <PeriodCard
          key={p.id}
          period={p}
          subject={entry?.subject}
          secondary={entry?.classLabel}
          room={entry?.room}
          isNow={now}
          showAvatar={false}
        />
      );
    });

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
        <View style={[styles.pickers, styles.pad]}>
          {mode === 'class' ? (
            <>
              <PickerField label="CLASS" value={className} placeholder="Class" onPress={() => setSheet('class')} />
              <PickerField label="SECTION" value={`Section ${sectionId}`} placeholder="Section" onPress={() => setSheet('section')} />
            </>
          ) : (
            <PickerField label="TEACHER" value={teacherName} placeholder="Select teacher" onPress={() => setSheet('teacher')} />
          )}
        </View>
        <DaySelector value={day} onChange={setDay} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.dayRow}>
          <Text style={styles.dayTitle}>{DAY_LONG[day]}</Text>
          {isToday ? <Text style={styles.today}>Today · 2 Oct 2026</Text> : null}
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
            {showWeek && !isLoading ? <WeekOverview periods={periods} slots={cls.slots} /> : null}
          </>
        ) : null}

        {isLoading && !refreshing ? (
          <TimetableSkeleton />
        ) : isEmpty ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-clear-outline" size={40} color={colors.textHint} />
            <Text style={styles.emptyTitle}>No periods scheduled</Text>
            <Text style={styles.emptyText}>
              {mode === 'class' ? `Tap a period to add a subject for ${DAY_LONG[day]}.` : `${teacherName} has no classes on ${DAY_LONG[day]}.`}
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
        visible={sheet === 'class'} title="Select class" options={CLASS_OPTIONS} value={classId}
        onClose={() => setSheet(null)} onSelect={(v) => { setClassId(v); setSheet(null); }}
      />
      <SelectSheet
        visible={sheet === 'section'} title="Select section" options={SECTION_OPTIONS} value={sectionId}
        onClose={() => setSheet(null)} onSelect={(v) => { setSectionId(v); setSheet(null); }}
      />
      <SelectSheet
        visible={sheet === 'teacher'} title="Select teacher" options={TEACHER_OPTIONS} value={teacherId}
        onClose={() => setSheet(null)} onSelect={(v) => { setTeacherId(v); setSheet(null); }}
      />
      <SlotEditSheet
        visible={editing !== null}
        day={day}
        period={editing}
        slot={editingSlot}
        onClose={() => setEditing(null)}
        onSave={(input) => {
          if (editing) cls.updateSlot(day, editing.id, input);
          setEditing(null);
        }}
        onClear={() => {
          if (editing) cls.clearSlot(day, editing.id);
          setEditing(null);
        }}
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
