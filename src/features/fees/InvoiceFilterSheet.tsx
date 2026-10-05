import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { Button, BottomSheet, OptionSheet, PickerField, DateField, TextField } from './parts';
import { CLASSES, parseDMY, type InvoiceStatus } from './mockFees';

export type InvoiceFilters = {
  student: string;
  classId: string;
  status: InvoiceStatus | '';
  /** DD/MM/YYYY as typed */
  dueDate: string;
};
export const EMPTY_FILTERS: InvoiceFilters = { student: '', classId: '', status: '', dueDate: '' };

const STATUSES: (InvoiceStatus | '')[] = ['', 'Issued', 'Paid', 'Partially paid', 'Overdue'];

type Props = { visible: boolean; value: InvoiceFilters; onApply: (f: InvoiceFilters) => void; onClose: () => void };

export function InvoiceFilterSheet({ visible, value, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<InvoiceFilters>(value);
  const [classOpen, setClassOpen] = useState(false);
  const [dateErr, setDateErr] = useState('');

  useEffect(() => {
    if (visible) { setDraft(value); setDateErr(''); }
  }, [visible, value]);

  const apply = () => {
    if (draft.dueDate.trim() && !parseDMY(draft.dueDate)) {
      setDateErr('Use a valid date as DD/MM/YYYY.');
      return;
    }
    onApply({ ...draft, student: draft.student.trim(), dueDate: draft.dueDate.trim() });
  };

  const className = CLASSES.find((c) => c.id === draft.classId)?.name ?? null;

  return (
    <BottomSheet visible={visible} title="Filter invoices" onClose={onClose}>
      <TextField
        label="Student" value={draft.student} placeholder="Filter by student..."
        onChangeText={(t) => setDraft((d) => ({ ...d, student: t }))}
      />
      <PickerField label="Class" value={className ?? 'All Classes'} placeholder="All Classes" onPress={() => setClassOpen(true)} />
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.chips}>
          {STATUSES.map((s) => {
            const on = draft.status === s;
            return (
              <Pressable key={s || 'all'} onPress={() => setDraft((d) => ({ ...d, status: s }))} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && { color: colors.white }]}>{s || 'ALL'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <DateField
        label="Due date (DD/MM/YYYY)" value={draft.dueDate} placeholder="dd/mm/yyyy" error={dateErr}
        onChangeText={(t) => { setDateErr(''); setDraft((d) => ({ ...d, dueDate: t })); }}
      />
      <View style={styles.actions}>
        <Button label="Reset" variant="soft" flex onPress={() => onApply(EMPTY_FILTERS)} />
        <Button label="Apply" flex onPress={apply} />
      </View>
      <OptionSheet
        visible={classOpen} title="Select class" allLabel="All Classes" value={draft.classId}
        options={CLASSES.map((c) => ({ value: c.id, label: c.name }))}
        onClose={() => setClassOpen(false)}
        onSelect={(v) => { setDraft((d) => ({ ...d, classId: v })); setClassOpen(false); }}
      />
    </BottomSheet>
  );
}

const styles = themed(() => StyleSheet.create({
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
}));
