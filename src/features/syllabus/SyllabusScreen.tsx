import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PickerField } from '../subjects/PickerField';
import { ExamSyllabusTab } from './ExamSyllabusTab';
import { SegmentedTabs, type SyllabusTabKey } from './SegmentedTabs';
import { SelectSheet } from './SelectSheet';
import { SyllabusTab } from './SyllabusTab';
import {
  CLASS_OPTIONS, DEFAULT_CLASS, DEFAULT_SECTION, DEFAULT_YEAR, SECTION_OPTIONS, YEAR_OPTIONS,
} from './mockSyllabus';

type SheetKind = 'class' | 'section' | 'year' | null;

export function SyllabusScreen() {
  const [tab, setTab] = useState<SyllabusTabKey>('syllabus');
  const [classId, setClassId] = useState(DEFAULT_CLASS);
  const [sectionId, setSectionId] = useState(DEFAULT_SECTION);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [sheet, setSheet] = useState<SheetKind>(null);

  const className = CLASS_OPTIONS.find((c) => c.value === classId)?.label ?? '';
  const caption = `${className} – ${sectionId} · ${year}`;
  const yearLabel = YEAR_OPTIONS.find((y) => y.value === year)?.label ?? year;

  return (
    <ScreenBackground>
      <ScreenHeader title="Syllabus" subtitle={caption} back />
      <View style={styles.top}>
        <SegmentedTabs value={tab} onChange={setTab} />
        <View style={styles.row}>
          <PickerField label="CLASS" value={className} placeholder="Class" onPress={() => setSheet('class')} />
          <PickerField label="SECTION" value={sectionId} placeholder="Section" onPress={() => setSheet('section')} />
          <PickerField
            label="YEAR"
            value={year === DEFAULT_YEAR ? 'Active year' : yearLabel}
            placeholder="Year"
            onPress={() => setSheet('year')}
          />
        </View>
      </View>

      <View style={styles.flex}>
        {tab === 'syllabus' ? (
          <SyllabusTab classId={classId} sectionId={sectionId} caption={caption} />
        ) : (
          <ExamSyllabusTab classId={classId} sectionId={sectionId} year={year} caption={caption} />
        )}
      </View>

      <SelectSheet
        visible={sheet === 'class'}
        title="Select class"
        options={CLASS_OPTIONS}
        value={classId}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setClassId(v); setSheet(null); }}
      />
      <SelectSheet
        visible={sheet === 'section'}
        title="Select section"
        options={SECTION_OPTIONS}
        value={sectionId}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setSectionId(v); setSheet(null); }}
      />
      <SelectSheet
        visible={sheet === 'year'}
        title="Select academic year"
        options={YEAR_OPTIONS}
        value={year}
        onClose={() => setSheet(null)}
        onSelect={(v) => { setYear(v); setSheet(null); }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
});
