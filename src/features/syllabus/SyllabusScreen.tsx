import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { getAcademicYearsMaster, getClassesMaster } from '../common/api';
import type { AcademicYearLean, ClassWithSections, SectionLite } from '../common/types';
import { useSession } from '../auth/session';
import { colors, themed } from '../../theme/tokens';
import { ExamSyllabusTab } from './ExamSyllabusTab';
import { PickerField } from './PickerField';
import { SegmentedTabs, type SyllabusTabKey } from './SegmentedTabs';
import { SelectSheet } from './SelectSheet';
import { SyllabusTab } from './SyllabusTab';
import type { Option } from './types';

type SheetKind = 'class' | 'section' | 'year' | null;

export function SyllabusScreen() {
  const permissions = useSession((s) => s.permissions);
  const canEdit = permissions.includes('syllabus.plan.update');

  const [tab, setTab] = useState<SyllabusTabKey>('syllabus');
  const [classes, setClasses] = useState<ClassWithSections[] | null>(null);
  const [years, setYears] = useState<AcademicYearLean[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [classId, setClassId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [yearId, setYearId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getClassesMaster(), getAcademicYearsMaster()])
      .then(([classesResult, yearsResult]) => {
        if (cancelled) return;
        setClasses(classesResult);
        setYears(yearsResult);
        const firstClass = classesResult[0];
        setClassId((prev) => prev ?? firstClass?.id ?? null);
        setSectionId((prev) => prev ?? firstClass?.sections[0]?.id ?? null);
        const activeYear = yearsResult.find((y) => y.isActive) ?? yearsResult[0];
        setYearId((prev) => prev ?? activeYear?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load classes/years. Pull to refresh.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const classOptions: Option[] = useMemo(
    () => (classes ?? []).map((c) => ({ value: c.id, label: c.name })),
    [classes],
  );
  const currentClass = classes?.find((c) => c.id === classId) ?? null;
  const sections: SectionLite[] = currentClass?.sections ?? [];
  const sectionOptions: Option[] = useMemo(
    () => sections.map((s) => ({ value: s.id, label: s.name })),
    [sections],
  );
  const yearOptions: Option[] = useMemo(
    () => (years ?? []).map((y) => ({ value: y.id, label: y.isActive ? `${y.label} (Active year)` : y.label })),
    [years],
  );

  const className = currentClass?.name ?? '';
  const sectionName = sections.find((s) => s.id === sectionId)?.name ?? '';
  const yearLabel = years?.find((y) => y.id === yearId)?.label ?? '';
  const caption = classId && sectionId ? `${className} – ${sectionName} · ${yearLabel}` : 'Loading…';

  const onSelectClass = useCallback(
    (id: string) => {
      setClassId(id);
      const nextClass = classes?.find((c) => c.id === id);
      setSectionId(nextClass?.sections[0]?.id ?? null);
      setSheet(null);
    },
    [classes],
  );

  const ready = classId !== null && sectionId !== null && yearId !== null;

  return (
    <ScreenBackground>
      <ScreenHeader title="Syllabus" subtitle={ready ? caption : undefined} back />
      <View style={styles.top}>
        <SegmentedTabs value={tab} onChange={setTab} />
        <View style={styles.row}>
          <PickerField label="CLASS" value={className || null} placeholder="Class" onPress={() => setSheet('class')} />
          <PickerField label="SECTION" value={sectionName || null} placeholder="Section" onPress={() => setSheet('section')} />
          <PickerField label="YEAR" value={yearLabel || null} placeholder="Year" onPress={() => setSheet('year')} />
        </View>
      </View>

      <View style={styles.flex}>
        {!ready ? (
          <View style={styles.loading}>
            {loadError ? <Text style={styles.loadError}>{loadError}</Text> : <ActivityIndicator color={colors.primary} />}
          </View>
        ) : tab === 'syllabus' ? (
          <SyllabusTab
            sectionId={sectionId}
            academicYearId={yearId}
            otherSections={sections.filter((s) => s.id !== sectionId)}
            caption={caption}
            canEdit={canEdit}
          />
        ) : (
          <ExamSyllabusTab sectionId={sectionId} academicYearId={yearId} caption={caption} canEdit={canEdit} />
        )}
      </View>

      <SelectSheet
        visible={sheet === 'class'}
        title="Select class"
        options={classOptions}
        value={classId ?? ''}
        onClose={() => setSheet(null)}
        onSelect={onSelectClass}
      />
      <SelectSheet
        visible={sheet === 'section'}
        title="Select section"
        options={sectionOptions}
        value={sectionId ?? ''}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setSectionId(v); setSheet(null); }}
      />
      <SelectSheet
        visible={sheet === 'year'}
        title="Select academic year"
        options={yearOptions}
        value={yearId ?? ''}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setYearId(v); setSheet(null); }}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadError: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
}));
